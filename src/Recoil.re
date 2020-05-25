// VALUE
type readOnlyMode =
  | ReadOnly;
type readWriteMode =
  | ReadWrite;

type t('value, 'mode);
type readOnly('value) = t('value, readOnlyMode);
type readWrite('value) = t('value, readWriteMode);

[@bs.module "recoil"] external isRecoilValue: 'a => bool = "isRecoilValue";

// ATOM
type atomConfig('value) = {
  key: string,
  default: 'value,
};

[@bs.module "recoil"]
external atom: atomConfig('value) => readWrite('value) = "atom";

// SELECTOR
type getter = {get: 'value 'mode. t('value, 'mode) => 'value};
type getterAndSetter = {
  get: 'value 'mode. t('value, 'mode) => 'value,
  set: 'value. (readWrite('value), 'value) => unit,
};
type selectorConfig('value) = {
  key: string,
  get: getter => 'value,
};
type selectorConfigWithWrite('value) = {
  key: string,
  get: getter => 'value,
  set: (getterAndSetter, 'value) => unit,
};

[@bs.module "recoil"]
external selector: selectorConfig('value) => readOnly('value) =
  "selector";
[@bs.module "recoil"]
external selectorWithWrite:
  selectorConfigWithWrite('value) => readWrite('value) =
  "selector";

// REACT BITS
type setter('a) = ('a => 'a) => unit

module RecoilRoot = {
  type initializeState = {
    set: 'value 'mode. (t('value, 'mode), 'value) => unit,
  };

  [@react.component] [@bs.module "recoil"]
  external make:
    (~initialState: initializeState=?, ~children: React.element) =>
    React.element =
    "RecoilRoot";
};

[@bs.module "recoil"]
external useRecoilState: readWrite('value) => ('value, setter('value)) =
  "useRecoilState";

[@bs.module "recoil"]
external useRecoilValue: t('value, 'mode) => 'value = "useRecoilValue";

[@bs.module "recoil"]
external useSetRecoilState: readWrite('value) => setter('value) =
  "useSetRecoilState";
