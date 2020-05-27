type t;
type puzzle = string;

[@bs.new] [@bs.module] external make: unit => t = "sudoku-solver-js";

[@bs.send]
external solve:
  (t, puzzle, [@bs.as {json|{"result": "array"}|json}] _) => Js.Array.t(int) =
  "solve";

let makePuzzle = (xs): puzzle => {
  xs
  ->Belt.List.map(x => {
      switch (x) {
      | None => "."
      | Some(value) => string_of_int(value)
      }
    })
  ->String.concat("", _);
};
