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

export async function memberSignupValidation (name : string, password : string,token : string,) : Promise<boolean> {
    const validationResult = memberSignupValidationSchema.safeParse({name,password,token});   
    if(validationResult.success) return true;
    console.log("Validation Failed", validationResult.error.errors);
    return false;
}   


const verifyEmailSchema = z.object({
    orgName : z.string(),
    token : z.string()
})

export async function verifyEmailValidation(token : string,orgName : string){
    const validationResult = verifyEmailSchema.safeParse({token,orgName});
    if(validationResult.success) return true;
    console.log("Validation Failed", validationResult.error.errors);
    return false;
}

const memberSignupValidationSchema = z.object({
    name : z.string(),
     password: z.string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    token : z.string()
});

