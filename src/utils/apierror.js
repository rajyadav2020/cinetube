class Apierror extends Error{
    constructor(
        statuscode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statuscode = statuscode
        this.data = null
        this.message = message
        this.success = false
        this.errors = this.errors


        if(stack){
            this.stack
        }else{
            Error.captureStackTrace(this,
                 this.constructor)
        }
    }
}

export {Apierror}