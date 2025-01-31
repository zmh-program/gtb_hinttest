"use client";
import { toast } from "sonner";
import { generateHintTest, generateMoreHint } from "@/lib/generator";
import { useReducer, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CirclePlay, Eye, RotateCcw, Lightbulb } from "lucide-react";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function getStructure(hint: string | undefined) {
  if (!hint) return "";
  const segements = hint.split(" ");
  const lengths = segements.map((seg) => seg.length);
  return lengths.join("-");
}

type GameState = {
  status: "start" | "playing" | "won" | "timeout";
  point: number;
  hintLength: number;
  hint?: string;
  matchedAnswers?: string[];
  moreHints?: Record<string, string>;
  answer: string;
  foundAnswers: string[];
  showAllAnswers: boolean;
  timeLeft: number;
  score: number;
};

function includesAnswer(checkingAnswer: string, anwsersList: string[]) {
  return anwsersList
    .map((answer) => answer.replace(/ /g, "").trim())
    .includes(checkingAnswer.replace(/ /g, "").trim());
}

type GameAction =
  | { type: "START_GAME"; payload: { point: number; hintLength: number } }
  | { type: "SET_POINT"; payload: number }
  | { type: "SET_HINT_LENGTH"; payload: number }
  | { type: "SUBMIT_ANSWER"; payload: string }
  | { type: "CHECK_ANSWER" }
  | { type: "SHOW_ALL_ANSWERS" }
  | { type: "RESET_GAME" }
  | { type: "GET_MORE_HINT"; payload: string }
  | { type: "TICK_TIMER" }
  | { type: "TIMEOUT" };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const { hint, matchedAnswers } = generateHintTest(
        action.payload.point,
        action.payload.hintLength,
      );

      return {
        ...state,
        point: action.payload.point,
        hintLength: action.payload.hintLength,
        status: "playing",
        hint,
        matchedAnswers,
        moreHints: {},
        answer: "",
        foundAnswers: [],
        showAllAnswers: false,
        timeLeft: 90,
      };
    }
    case "SET_POINT":
      setLocalStorage("point", action.payload.toString());
      return { ...state, point: action.payload };
    case "SET_HINT_LENGTH":
      setLocalStorage("hint_length", action.payload.toString());
      return { ...state, hintLength: action.payload };
    case "SUBMIT_ANSWER":
      return { ...state, answer: action.payload };
    case "CHECK_ANSWER": {
      const formattedAnswer = state.answer.trim().toLowerCase();
      if (
        !includesAnswer(formattedAnswer, state.matchedAnswers || []) ||
        includesAnswer(formattedAnswer, state.foundAnswers)
      ) {
        toast.error("Answer is incorrect");
        return { ...state, answer: "" };
      }

      const newFoundAnswers = [...state.foundAnswers, formattedAnswer];
      const isComplete =
        newFoundAnswers.length === (state.matchedAnswers?.length || 0);

      if (isComplete) {
        const newScore = state.score + 1;
        setLocalStorage("score", newScore.toString());
        toast.success(
          `Congratulations! You earned a point! Total score: ${newScore}`,
        );
        return {
          ...state,
          answer: "",
          foundAnswers: newFoundAnswers,
          status: "won",
          score: newScore,
        };
      }

      toast.success(
        "Answer is correct! Current progress: " +
          newFoundAnswers.length +
          "/" +
          (state.matchedAnswers?.length || 0),
      );
      return {
        ...state,
        answer: "",
        foundAnswers: newFoundAnswers,
      };
    }
    case "TICK_TIMER": {
      if (state.timeLeft <= 1) {
        return {
          ...state,
          timeLeft: 0,
          status: "timeout",
          showAllAnswers: true,
        };
      }
      return {
        ...state,
        timeLeft: state.timeLeft - 1,
      };
    }
    case "TIMEOUT": {
      return {
        ...state,
        status: "timeout",
        showAllAnswers: true,
      };
    }
    case "GET_MORE_HINT": {
      const targetAnswer = action.payload;
      const currentHint = state.moreHints?.[targetAnswer] || state.hint;
      const moreHints = generateMoreHint(targetAnswer, currentHint || "");
      return {
        ...state,
        moreHints: {
          ...state.moreHints,
          [targetAnswer]: moreHints,
        },
      };
    }
    case "SHOW_ALL_ANSWERS":
      return { ...state, showAllAnswers: true };
    case "RESET_GAME":
      return { ...initialState, score: state.score };
    default:
      return state;
  }
}

const initialState: GameState = {
  status: "start",
  point: 1,
  hintLength: 2,
  answer: "",
  foundAnswers: [],
  showAllAnswers: false,
  timeLeft: 90,
  score: parseInt(getLocalStorage("score") || "0"),
};

export default function Generator() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [point, setPoint] = useState(getLocalStorage("point") || "1");
  const [hintLength, setHintLength] = useState(
    getLocalStorage("hint_length") || "2",
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.status === "playing" && state.timeLeft > 0) {
      timer = setInterval(() => {
        dispatch({ type: "TICK_TIMER" });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.status, state.timeLeft]);

  if (state.status === "start") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-6"
      >
        <div className="space-y-3">
          <Label className="text-lg font-medium">Select Theme Point</Label>
          <RadioGroup
            value={point}
            onValueChange={(value) => setPoint(value)}
            className="grid gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="point-1" />
              <Label htmlFor="point-1" className="font-medium cursor-pointer">
                1 Point Theme (≤5 letters)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="point-2" />
              <Label htmlFor="point-2" className="font-medium cursor-pointer">
                2 Point Theme (6-8 letters)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="point-3" />
              <Label htmlFor="point-3" className="font-medium cursor-pointer">
                3 Point Theme (≥9 letters)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label htmlFor="hint-length" className="text-lg font-medium">
            Initial Given Hint Length
          </Label>
          <Input
            id="hint-length"
            value={hintLength}
            onChange={(e) => setHintLength(e.target.value)}
            className="text-lg"
          />
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            dispatch({
              type: "START_GAME",
              payload: {
                point: parseInt(point) || 1,
                hintLength: parseInt(hintLength) || 2,
              },
            });
          }}
        >
          <CirclePlay className="w-5 h-5 mr-2" />
          Start Game
        </Button>

        <div className="text-center">
          <p className="text-sm">Total Score: {state.score}</p>
        </div>
      </motion.div>
    );
  }

  if (state.showAllAnswers || state.status === "timeout") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 p-6"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50/50 border border-yellow-200"
        >
          <img src="/emoji/alarm.png" alt="" className="w-8 h-8" />
          <p className="text-yellow-800 font-medium">
            {state.status === "timeout" ? "Time's up!" : "Game Over!"} You found{" "}
            {state.foundAnswers.length} out of {state.matchedAnswers?.length}{" "}
            answers.
          </p>
        </motion.div>
        <div className="space-y-3">
          <Label className="text-lg font-medium">Hint</Label>
          <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted">
            {state.hint}
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-lg font-medium">Found Answers</Label>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {state.foundAnswers.map((answer) => (
                <motion.span
                  key={answer}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full font-medium"
                >
                  {answer}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-lg font-medium">Missed Answers</Label>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {state.matchedAnswers
                ?.filter((answer) => !state.foundAnswers.includes(answer))
                .map((answer) => (
                  <motion.span
                    key={answer}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full font-medium"
                  >
                    {answer}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: "RESET_GAME" })}
        >
          <CirclePlay className="w-5 h-5 mr-2" />
          Play Again
        </Button>
      </motion.div>
    );
  }

  if (state.status === "won") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 p-6"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-green-50/50 border border-green-200"
        >
          <img src="/emoji/fireworks.png" alt="" className="w-8 h-8" />
          <p className="text-green-800 font-medium">
            Congratulations! You found all {state.matchedAnswers?.length}{" "}
            answers with {state.timeLeft} seconds remaining!
          </p>
        </motion.div>
        <div className="space-y-3">
          <Label className="text-lg font-medium">Hint</Label>
          <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted">
            {state.hint}
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-lg font-medium">Found Answers</Label>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {state.foundAnswers.map((answer) => (
                <motion.span
                  key={answer}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full font-medium"
                >
                  {answer}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: "RESET_GAME" })}
        >
          <CirclePlay className="w-5 h-5 mr-2" />
          Play Again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-6"
    >
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium"></div>
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={
                state.timeLeft > 30
                  ? "#22c55e"
                  : state.timeLeft > 10
                    ? "#eab308"
                    : "#ef4444"
              }
              strokeWidth="4"
              strokeDasharray={`${(state.timeLeft / 90) * 126} 126`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-sm font-medium ${state.timeLeft <= 10 ? "text-red-500" : ""}`}
            >
              {state.timeLeft}
            </span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-bold tracking-[2px] p-4 rounded-lg bg-muted text-center"
      >
        {state.hint}
        <span className="ml-2 text-sm text-muted-foreground tracking-normal font-normal">
          ({getStructure(state.hint)})
        </span>
      </motion.div>
      <div className="space-y-3">
        <Label className="text-lg font-medium">
          Found Answers ({state.foundAnswers.length}/
          {state.matchedAnswers?.length})
        </Label>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {state.foundAnswers.map((answer) => (
              <motion.span
                key={answer}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full font-medium"
              >
                {answer}
              </motion.span>
            ))}

            {state.matchedAnswers
              ?.filter((answer) => !includesAnswer(answer, state.foundAnswers))
              .map((answer, index) => (
                <motion.div
                  key={`placeholder-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full"
                >
                  <span className="text-muted-foreground font-medium">
                    {state.moreHints?.[answer] || "??"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full"
                    onClick={() =>
                      dispatch({ type: "GET_MORE_HINT", payload: answer })
                    }
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: "CHECK_ANSWER" });
        }}
        className="space-y-4"
      >
        <Label htmlFor="answer" className="text-lg font-medium">
          Your Answer
        </Label>
        <div className="flex gap-3 flex-col sm:flex-row">
          <Input
            id="answer"
            value={state.answer}
            onChange={(e) =>
              dispatch({ type: "SUBMIT_ANSWER", payload: e.target.value })
            }
            className="text-lg"
          />
          <Button type="submit" size="lg">
            Submit
          </Button>
        </div>
      </form>

      <div className="flex flex-col md:flex-row gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => dispatch({ type: "SHOW_ALL_ANSWERS" })}
        >
          <Eye className="w-5 h-5 mr-2" />
          Show All Answers
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => dispatch({ type: "RESET_GAME" })}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset Game
        </Button>
      </div>
    </motion.div>
  );
}
