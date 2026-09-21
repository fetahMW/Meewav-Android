// Fourteen bundled clips at most. Full reads avoid Android WebView range-reader churn.
const clips = new Map<string,Promise<string>>();
export function cageLocalMedia(url:string):Promise<string> {
 let result=clips.get(url);
 if(!result){result=fetch(url).then(async response=>{if(!response.ok)throw new Error("Clip indisponible");return URL.createObjectURL(await response.blob());}).catch(error=>{clips.delete(url);throw error;});clips.set(url,result);}
 return result;
}
