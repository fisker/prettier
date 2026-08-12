const foo: SomeThing<boolean> = func();
const bar: SomeThing<boolean, boolean> = func();
const fooo: SomeThing<{ [P in "x" | "y"]: number }> = func();
const baar: SomeThing<K extends T ? G : S> = func();
const foooooooooooooo1: SomeThing<boolean> = looooooooooooooooooooooooooooooongNameFunc();
const baaaaaaaaaaaaaaaaaaaaar: SomeThing<boolean, boolean> = looooooooooooooooooooooooooooooongNameFunc();
const baaaaaaaaaaaaaaar: SomeThing<{ [P in "x" | "y"]: number }> = looooooooooooooooooooooooooooooongNameFunc();
const baaaaaaaaaaaaaaaar: SomeThing<K extends T ? G : S> = looooooooooooooooooooooooooooooongNameFunc();
const isAnySuccessfulAttempt$: Observable<boolean> = this._quizService.isAnySuccessfulAttempt$().pipe(
  tap((isAnySuccessfulAttempt: boolean) => {
    this.isAnySuccessfulAttempt = isAnySuccessfulAttempt;
  }),
);
const isAnySuccessfulAttempt2$: Observable<boolean> = this._someMethodWithLongName();
const foooooooooooooo2: SomeThing<boolean | string> = looooooooooooooooooooooooooooooongNameFunc();
const foooooooooooooo3: SomeThing<boolean & string> = looooooooooooooooooooooooooooooongNameFunc();
const foooooooooooooo4: SomeThing<keyof string> = looooooooooooooooooooooooooooooongNameFunc();
const foooooooooooooo5: SomeThing<string[]> = looooooooooooooooooooooooooooooongNameFunc();
const foooooooooooooo6: SomeThing<string["anchor"]> = looooooooooooooooooooooooooooooongNameFunc();
