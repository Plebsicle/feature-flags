export  async function GET(request:Request) {
    const data = {id : 1,name : "pleb"}
    return Response.json({data});    
}