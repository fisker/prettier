// Member expressions
(a?.b)!   ();
(a?.b!)   ();
(a!?.b)   ();
(a.b?.c)!   ();
(a.b?.c!)   ();
(a.b!?.c)   ();
(a!.b?.c)   ();
(a?.b.c)!   ();
(a?.b.c!)   ();
(a?.b!.c)   ();
(a!?.b.c)   ();
(a[b?.c])!   ();
(a[b?.c]!)   ();
(a[b?.c!])   ();
(a[b!?.c])   ();
((a?.b).c)!   ();
((a?.b).c!)   ();
((a?.b!).c)   ();
((a!?.b).c)   ();
(a[b?.()])!   ();
(a[b?.()]!)   ();
(a[b?.()!])   ();
(a[b!?.()])   ();
(a![b?.()])   ();
((a?.b).c)!   ();
((a?.b).c!)   ();
((a?.b)!.c)   ();
((a?.b!).c)   ();
((a!?.b).c)   ();
((a?.()).b)!   ();
((a?.()).b!)   ();
((a?.())!.b)   ();
((a?.()!).b)   ();
((a!?.()).b)   ();

// Call expressions
(a?.())!   ();
(a?.()!)   ();
(a!?.())   ();
(a.b.c?.())!   ();
(a.b.c?.()!)   ();
(a.b.c!?.())   ();
(a.b?.c())!   ();
(a.b?.c()!)   ();
(a.b!?.c())   ();
(a?.b.c())!   ();
(a?.b.c()!)   ();
(a?.b!.c())   ();
(a(b?.c))!   ();
(a(b?.c)!)   ();
(a(b?.c!))   ();
((a?.b)())!   ();
((a?.b)()!)   ();
((a?.b)!())   ();
((a?.b!)())   ();
((a?.())())!   ();
((a?.())()!)   ();
((a?.())!())   ();
((a?.()!)())   ();
((a!?.())())   ();

// Not `.callee`
foo((a?.b)!)
