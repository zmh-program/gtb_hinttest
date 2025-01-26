"use client";

import { generateHintTest, generateMoreHint } from "@/lib/generator";
import { useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  AlertCircle,
  CirclePlay,
  Eye,
  RotateCcw,
  Lightbulb,
} from "lucide-react";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";

function getStructure(hint: string | undefined) {
  if (!hint) return "";
  const segements = hint.split(" ");
  const lengths = segements.map((seg) => seg.length);
  return lengths.join("-");
}

type GameState = {
  status: "start" | "playing" | "won";
  point: number;
  hintLength: number;
  hint?: string;
  matchedAnswers?: string[];
  moreHints?: Record<string, string>;
  answer: string;
  foundAnswers: string[];
  showAllAnswers: boolean;
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
  | { type: "GET_MORE_HINT"; payload: string };

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
      if (
        !includesAnswer(state.answer, state.matchedAnswers || []) ||
        includesAnswer(state.answer, state.foundAnswers)
      ) {
        return { ...state, answer: "" };
      }
      const newFoundAnswers = [...state.foundAnswers, state.answer];
      const isComplete =
        newFoundAnswers.length === (state.matchedAnswers?.length || 0);
      return {
        ...state,
        answer: "",
        foundAnswers: newFoundAnswers,
        status: isComplete ? "won" : "playing",
      };
    }
    case "GET_MORE_HINT": {
      const targetAnswer = action.payload;
      const currentHint = state.moreHints?.[targetAnswer] || state.hint;

      // Generate more hints for the target answer
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
      return { ...initialState };
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
};

export default function Generator() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [point, setPoint] = useState(getLocalStorage("point") || "1");
  const [hintLength, setHintLength] = useState(
    getLocalStorage("hint_length") || "2",
  );

  if (state.status === "start") {
    return (
      <div className="space-y-8 p-4">
        <div className="space-y-4">
          <Label>Select Theme Point</Label>
          <RadioGroup value={point} onValueChange={(value) => setPoint(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="point-1" />
              <Label htmlFor="point-1">1 Point Theme (≤5 letters)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="point-2" />
              <Label htmlFor="point-2">2 Point Theme (6-8 letters)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="point-3" />
              <Label htmlFor="point-3">3 Point Theme (≥9 letters)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label htmlFor="hint-length">Initial Given Hint Length</Label>
          <Input
            id="hint-length"
            value={hintLength}
            onChange={(e) => setHintLength(e.target.value)}
          />
        </div>

        <Button
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
          <CirclePlay className="w-4 h-4" />
          Start Game
        </Button>
      </div>
    );
  }

  if (state.showAllAnswers) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <p className="text-yellow-700">
            Game Over! You found {state.foundAnswers.length} out of{" "}
            {state.matchedAnswers?.length} answers.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Hint</Label>
          <div className="flex flex-wrap gap-2">{state.hint}</div>
        </div>
        <div className="space-y-2">
          <Label>Found Answers</Label>
          <div className="flex flex-wrap gap-2">
            {state.foundAnswers.map((answer) => (
              <span
                key={answer}
                className="px-2 py-1 bg-green-100 rounded-md text-sm"
              >
                {answer}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Missed Answers</Label>
          <div className="flex flex-wrap gap-2">
            {state.matchedAnswers
              ?.filter((answer) => !state.foundAnswers.includes(answer))
              .map((answer) => (
                <span
                  key={answer}
                  className="px-2 py-1 bg-red-100 rounded-md text-sm"
                >
                  {answer}
                </span>
              ))}
          </div>
        </div>
        <Button onClick={() => dispatch({ type: "RESET_GAME" })}>
          <CirclePlay className="w-4 h-4" />
          Play Again
        </Button>
      </div>
    );
  }

  if (state.status === "won") {
    return (
      <div className="space-y-8 p-4">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <p className="text-green-700">
            Congratulations! You found all {state.matchedAnswers?.length}{" "}
            answers!
          </p>
        </div>
        <div className="space-y-2">
          <Label>Hint</Label>
          <div className="flex flex-wrap gap-2">{state.hint}</div>
        </div>
        <div className="space-y-2">
          <Label>Found Answers</Label>
          <div className="flex flex-wrap gap-2">
            {state.foundAnswers.map((answer) => (
              <span
                key={answer}
                className="px-2 py-1 bg-green-100 rounded-md text-sm"
              >
                {answer}
              </span>
            ))}
          </div>
        </div>
        <Button onClick={() => dispatch({ type: "RESET_GAME" })}>
          <CirclePlay className="w-4 h-4" />
          Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <div className="text-2xl font-bold tracking-[2px]">
        {state.hint}
        <span className="ml-0.5 text-sm text-muted-foreground tracking-normal font-normal">
          ({getStructure(state.hint)})
        </span>
      </div>
      <div className="space-y-2">
        <Label>
          Found Answers ({state.foundAnswers.length}/
          {state.matchedAnswers?.length})
        </Label>
        <div className="flex flex-wrap gap-2">
          {state.foundAnswers.map((answer) => (
            <span
              key={answer}
              className="px-2 py-1 bg-green-100 rounded-md text-sm"
            >
              {answer}
            </span>
          ))}

          {state.matchedAnswers
            ?.filter((answer) => !state.foundAnswers.includes(answer))
            .map((answer, index) => (
              <div
                key={`placeholder-${index}`}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md"
              >
                <span className="text-sm text-gray-400">
                  {state.moreHints?.[answer] || "??"}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="!h-4 !w-4 !p-0.5 ml-0.5 text-gray-400"
                  onClick={() =>
                    dispatch({ type: "GET_MORE_HINT", payload: answer })
                  }
                >
                  <Lightbulb className="!h-3 !w-3" />
                </Button>
              </div>
            ))}
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: "CHECK_ANSWER" });
        }}
        className="space-y-4"
      >
        <Label htmlFor="answer">Your Answer</Label>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Input
            id="answer"
            value={state.answer}
            onChange={(e) =>
              dispatch({ type: "SUBMIT_ANSWER", payload: e.target.value })
            }
          />
          <Button type="submit">Submit</Button>
        </div>
      </form>

      <div className="flex flex-col md:flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "SHOW_ALL_ANSWERS" })}
        >
          <Eye className="w-4 h-4" />
          Show All Answers
        </Button>
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "RESET_GAME" })}
        >
          <RotateCcw className="!w-3.5 !h-3.5" />
          Reset Game
        </Button>
      </div>
    </div>
  );
}
