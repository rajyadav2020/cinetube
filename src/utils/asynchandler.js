const asynchandler = (reqhandler) =>{
    (req,res,next) =>{
        Promise.resolve(reqhandler(req,res,next)).catch
        ((err)=>next(err) )
    }

}



export {asynchandler}


// const asynchandler = (fn) => async (req,res,next)=>{
//     try{
//         await fn(req,res,next)

//     }catch(error){
//         res.status(error.code || 500).json({
//             success : false,
//             message: error.message
//         })
//     }
// }