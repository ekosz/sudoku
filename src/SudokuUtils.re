open Belt;

let memoizeByInt = f => {
  // Create the map where we'll store the values
  let map = MutableMap.Int.make();
  // Return a function that takes a string and returns a value
  // from the cache or the function
  id => {
    switch (map->MutableMap.Int.get(id)) {
    | Some(value) => value
    | None =>
      let value = f(id);
      map->MutableMap.Int.set(id, value);
      value;
    };
  };
};
