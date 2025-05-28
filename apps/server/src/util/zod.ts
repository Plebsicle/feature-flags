import {z} from 'zod'

const userSignupSchema = z.object({
    name: z.string(),
    email: z.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    orgName : z.string()
});

const memberSignupSchema = z.object({
    token : z.string(),
    email: z.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
    name : z.string(),
    password : z.string()
})

const userSigninSchema = z.object({
    email: z.string().min(1, { message: "This Field has to be filled" }).email("This is not a Valid Email"),
     password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

export async function signinValidation(email : string,password : string) : Promise<boolean> {
     const validationResult = userSigninSchema.safeParse({ email, password });
    if (validationResult.success) return true;
    console.log("Validation Failed", validationResult.error.errors);
    return false;
}

export async function signupValidation(name: string, email: string, password: string,orgName : string): Promise<boolean> {
    const validationResult = userSignupSchema.safeParse({ name, email, password ,orgName});
    if (validationResult.success) return true;

    console.log("Validation Failed", validationResult.error.errors);
    return false;
}

export async function memberSignupValidation (token : string,email : string,name : string, password : string) : Promise<boolean> {
    const validationResult = memberSignupSchema.safeParse({token,email,name,password});   
    if(validationResult.success) return true;
    console.log("Validation Failed", validationResult.error.errors);
    return false;
}   