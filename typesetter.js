FontDec=(()=>{
	var id=0;
	function enfamily(fr){return fr.join?fr.join(','):fr;}
	function FontDec(family,size,weight,style,variant){
		var _id=++id;
		this.__defineGetter__("id",()=>{return id;});
		this.__defineGetter__("family",()=>{return family;});
		this.__defineGetter__("size",()=>{return size;});
		this.__defineGetter__("weight",()=>{return weight;});
		this.__defineGetter__("style",()=>{return style;});
		this.__defineGetter__("variant",()=>{return variant;});
		this.__defineSetter__("weight",(x)=>{weight=x;});
		this.__defineSetter__("family",(x)=>{family=x;});
		this.__defineSetter__("size",(x)=>{size=x;});
		this.__defineSetter__("style",(x)=>{style=x;});
		this.__defineSetter__("variant",(x)=>{variant=x;});
		this.dup=()=>{return new FontDec(family,size,weight,style,variant);};
		this.__defineGetter__("format",()=>{return [variant||'',style||'',weight||'',size+'px',enfamily(family)].join(' ');});
		return this;
	}
	return FontDec;
})();

function TextBlock(str,font){
	this.str=str;
	this.font=font;
	this.width=0;
}
function Canv(elem){
	var ctx=elem.getContext('2d');
	var nowTextface=null;
	function setTextface(tf){
		if(nowTextface!=tf){
			ctx.font=(nowTextface=tf).format;
			console.log("Font change",tf.id)
		}
	}
	function measure(text_block){
		setTextface(text_block.font);
		return ctx.measureText(text_block.str).width;
	}
	this.__defineGetter__("context",()=>ctx);
	this.__defineGetter__("element",()=>elem);
	this.__defineGetter__("textface",()=>nowTextface);
	this.measure=measure;
	function batchMeasure(arr){
		var arx=arr.slice(0).sort((a,b)=>a.font.id<b.font.id);
		arx.forEach((i)=>{i.width=measure(i)});
	}
	this.batchMeasure=batchMeasure;
	function Type(text_block,x,y){
		setTextface(text_block.font);
		ctx.fillText(text_block.str,x,y);
	}
	this.write=Type;
	function TypeLineWithSpacing(arr,x,y,sp){arr.forEach((_)=>{Type(_,x,y),x+=sp+_.width;});}
	this.write_line=TypeLineWithSpacing;
}
var isNumber=(x)=>(typeof x=='number')||(x.constructor==Number);
function slices(arr,Pre,t,r,e,L){
	var len=arr.length;
	console.log(arr);
	var ret=[];
	var st=len-1;
	if(r){ret.push([arr.slice(t+1),e]);st=t;}
	while(st>=0){
		var nx=Pre[st];
		var tlen=0;
		for(var i=nx;i<=st;++i)
			tlen+=arr[i].width;
		var rlen=st-nx>0?st-nx:1;
		ret.push([arr.slice(nx,st+1),(L-tlen)/rlen]);
		st=nx-1;
	}return ret.reverse();
}
function typeset(Canv,arr,width,objectSpacing,PenaltyFunction,lineHeight,x,y){
	var len=arr.length;
	console.log(arr);
	if(len==1){return Canv.Type(arr[0],x,y);}
	Canv.batchMeasure(arr);
	var Pen=new Float64Array(len);
	var Pre=new Int32Array(len);
	var Lenx=new Float64Array(len);
	for(var i=0;i<len;++i)
		Lenx[i]=arr[i].width;
	for(var i=1;i<len;++i)
		Lenx[i]+=Lenx[i-1];
	for(var i=0,j=0,k=0,e,t,lt;j<len;++j){
		Pen[j]=PenaltyFunction(width-arr[j].width-objectSpacing);Pre[j]=j;
		e=-1/.0;t=0;
		for(;e<3&&k<=j;++k){
			lt=Lenx[j]-(k==0?0:Lenx[k-1]);
			if(lt>width){
				t=k+1;
				continue;
			}
			var count=k==j?1:j-k;
			var penal=PenaltyFunction((width-lt)/count-objectSpacing)+(k-1>=0?Pen[k-1]:0);
			if(penal<Pen[j])
				Pen[j]=penal,Pre[j]=k,e=0;
			else e+=1;
		}
		k=t;
	}
	var t=len-1,q=Pen[t],r=0;
	for(var i=len-1,j=-objectSpacing;i>=0;--i){
		j+=objectSpacing+arr[i].width;
		if(j>width)break;
		if(i==0){
			r=1;break;
		}
		if(Pen[i-1]<q){q=Pen[i-1];t=i-1;r=1;}
	}
	var k=slices(arr,Pre,t,r,objectSpacing,width);
	k.forEach((_)=>{
		Canv.write_line(_[0],x,y,_[1]);
		y+=lineHeight;
	});
}
