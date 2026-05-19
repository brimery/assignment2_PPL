import { ClassExp, ProcExp, Exp, Program, VarDecl, CExp, makeProcExp, makeVarDecl, makeVarRef, makeLitExp, makeAppExp, makePrimOp, isProcExp, makeIfExp, Binding, isProgram, isAppExp, isBoolExp, isClassExp, isDefineExp, isIfExp, isLetExp, isLitExp, isNumExp, isPrimOp, isStrExp, isVarRef, makeBinding, makeClass, makeDefineExp, makeLetExp, makeProgram } from "./L3-ast";
import { Result, bind, makeFailure, makeOk, mapResult, mapv } from "../shared/result";
import { makeSymbolSExp } from "./L3-value";

/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>{
    const methodsToDispatch = (methods: Binding[]): CExp =>
        methods.length === 0
            ? makeLitExp(makeSymbolSExp("error"))
            : makeIfExp(
                makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(methods[0].var.var))]),
                (methods[0].val as ProcExp).body[0],
                methodsToDispatch(methods.slice(1))
            )

            
    const innerProc=makeProcExp([makeVarDecl("msg")],[methodsToDispatch(exp.methods)]);  
    return makeProcExp(exp.fields,[innerProc]);   
}
       
const transformCExp = (exp: CExp): Result<CExp> =>
    isClassExp(exp) ? makeOk(class2proc(exp)) :
    isNumExp(exp) || isBoolExp(exp) || isStrExp(exp) || isPrimOp(exp) || isVarRef(exp) || isLitExp(exp) ? makeOk(exp) :
    isIfExp(exp) ? mapv(mapResult(transformCExp, [exp.test, exp.then, exp.alt]),
                        ([test, then, alt]) => makeIfExp(test, then, alt)) :
    isProcExp(exp) ? mapv(mapResult(transformCExp, exp.body),
                          body => makeProcExp(exp.args, body)) :
    isAppExp(exp) ? mapv(mapResult(transformCExp, [exp.rator, ...exp.rands]),
                         ([rator, ...rands]) => makeAppExp(rator, rands)) :
    isLetExp(exp) ? bind(
        mapResult((b: Binding) => mapv(transformCExp(b.val), val => makeBinding(b.var.var, val)), exp.bindings),
        bindings => mapv(mapResult(transformCExp, exp.body), body => makeLetExp(bindings, body))
    ) : makeFailure(`Unknown CExp: ${exp}`);

export const transform = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp) ? mapv(mapResult(transform, exp.exps as Exp[]), exps => makeProgram(exps as Exp[])) :
    isDefineExp(exp) ? mapv(transformCExp(exp.val), val => makeDefineExp(exp.var, val)) :
    transformCExp(exp as CExp);

