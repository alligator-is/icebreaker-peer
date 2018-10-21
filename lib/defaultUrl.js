const utils = require('icebreaker-network/lib/util')
const url = require('url')
const path = require("path")

module.exports=function defaultUrl(addr, params) {
  const p = url.parse(addr);
  if(p.protocol.indexOf("+unix") !==-1 && params.appKey!=null && p.pathname !=null){
    if(p.pathname.indexOf(params.appKey )=== -1)
     p.pathname = path.posix.join(p.pathname , params.appKey).replace("//","/")
  }
  if ((p.pathname == null || p.pathname.length ===1 ) && params.appKey!=null) p.pathname = '/' + params.appKey
  params.encoding = params.encoding||'base64'
  let auth=p.auth
  if (p.auth == null && params.keys.publicKey!=null) auth = utils.encode(params.keys.publicKey,params.encoding)
  else if (p.auth == null && params.keys.id!=null) auth = utils.encode(params.keys.id,params.encoding) 
  if(auth){
    let res = p.format()
    if(res.indexOf(auth) ===-1)
    res= res.replace(p.protocol+"//",p.protocol+"//"+encodeURIComponent(auth)+"@");
    return res 
  }
  return url.format(p)
}