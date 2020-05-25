let make = cns => cns->Belt.List.keep(x => x !== "")->String.concat(" ", _);

let ifTrue = (cn, x) => x ? cn : "";
