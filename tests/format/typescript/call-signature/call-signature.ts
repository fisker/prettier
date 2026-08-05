type T1 = {
  (): void;
  second: string;
};

type T2 = {
  (): void; // prettier-ignore
  second: string;
};

type T3 = {
  (): void; // comment
  second: string;
};

type T4 = {
  first: string;
  (): void;
};

type T5 = {
  first: string;
  (): void; // prettier-ignore
};

type T6 = {
  first: string;
  (): void; // comment
};

interface I1 {
  (): void;
  second: string;
}

interface I2 {
  (): void; // prettier-ignore
  second: string;
}

interface I3 {
  (): void; // comment
  second: string;
}

interface I4 {
  first: string;
  (): void;
}

interface I5 {
  first: string;
  (): void; // prettier-ignore
}

interface I6 {
  first: string;
  (): void; // comment
}
