type FieldLayoutWith1<
  T extends string,
  S extends unknown = { width: string }
> = {
  type: T;
  code: string;
  size: S;
};

type FieldLayoutWith2<
  T extends string,
  S extends unknown,
> = {
  type: T;
  code: string;
  size: S;
};

type FieldLayoutWith3<
  S extends unknown = { width: string }
> = {
  type: T;
  code: string;
  size: S;
};

type FieldLayoutWith4<
  T extends stringggggggggggg,
  T extends stringggggggggggg
> = {
  type: T;
  code: string;
  size: S;
};

type FieldLayoutWith5<
  T extends stringggggggggggg,
  S = stringggggggggggggggggg
> = {
  type: T;
  code: string;
  size: S;
};
