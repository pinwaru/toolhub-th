const search=document.getElementById("search");

if(search){

search.addEventListener("keyup",function(){

const value=this.value.toLowerCase();

const tools=document.querySelectorAll(".tool");

tools.forEach(tool=>{

tool.style.display=

tool.innerText.toLowerCase().includes(value)

?

"block"

:

"none";

});

});

}
