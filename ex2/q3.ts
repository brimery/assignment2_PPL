import { Exp, Program, CExp, isProgram, isDefineExp, isNumExp, isBoolExp, isStrExp,
         isPrimOp, isVarRef, isAppExp, isIfExp, isProcExp,
         AppExp } from './L3/L3-ast';
import { Result, makeOk } from './shared/result';

const primOpToP = (op: string): string =>
    op === "=" ? "==" :
    op === "boolean?" ? "(lambda x : (type(x) == bool))" :
    op === "number?"  ? "(lambda x : (type(x) == int))" :
    op;

const appExpToP = (exp: AppExp): string => {
    const rands = exp.rands.map(expToP);
    if (isPrimOp(exp.rator)) {
        const op = exp.rator.op;
        if (op === "not") return `(not ${rands[0]})`;
        const pyOp = primOpToP(op);
        return `(${rands.join(` ${pyOp} `)})`;
    }
    if (isProcExp(exp.rator))
        return `${expToP(exp.rator)}(${rands.join(",")})`;
    return `${expToP(exp.rator)}(${rands.join(",")})`;
};

const expToP = (exp: CExp): string =>
    isNumExp(exp)  ? `${exp.val}` :
    isBoolExp(exp) ? (exp.val ? "True" : "False") :
    isStrExp(exp)  ? `"${exp.val}"` :
    isVarRef(exp)  ? exp.var :
    isPrimOp(exp)  ? primOpToP(exp.op) :
    isIfExp(exp)   ? `(${expToP(exp.then)} if ${expToP(exp.test)} else ${expToP(exp.alt)})` :
    isProcExp(exp) ? `(lambda ${exp.args.map(a => a.var).join(",")} : ${expToP(exp.body[0])})` :
    isAppExp(exp)  ? appExpToP(exp) :
    "";

const expToStr = (exp: Exp): string =>
    isDefineExp(exp) ? `${exp.var.var} = ${expToP(exp.val)}` :
    expToP(exp);

export const l2ToPython = (exp: Exp | Program): Result<string> =>
    isProgram(exp)   ? makeOk(exp.exps.map(expToStr).join("\n")) :
    isDefineExp(exp) ? makeOk(`${exp.var.var} = ${expToP(exp.val)}`) :
    makeOk(expToP(exp as CExp));