const validator= (schema)=>{
    return (req, res, next)=>{
        //validate user input from req.body
        const result= schema.safeParse(req.body);

        if(!result.success){
            const formattedErrors= result.error?.errors?.map(error=> {
                return {field: error.path.join('.'), error: error.message};
            }) || 'Input validation error';

            console.log(`errors: ${formattedErrors}`);
            return res.status(400).json({message: `input validation failed`, errors: formattedErrors});
        }
        req.body= result.data;
        next();
    }
}

export default validator;