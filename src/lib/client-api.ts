import { auth } from "./firebase";
export async function clientPost(path:string,body:unknown){
  const user=auth.currentUser;
  if(!user)throw new Error("Please sign in.");
  const token=await user.getIdToken();
  const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"Please try again.");
  return data;
}