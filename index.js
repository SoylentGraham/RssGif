var GifEncoder = require('./GifEncoder.js');
var http = require('http');
var URL = require('url');





let Debug_Palette = [ 0,255,255,	0,0,0,	255,0,0,	0,255,0,	255,255,0,	0,0,255,	255,0,255,	0,255,255,	255,255,255 ];
let Debug_Colours = [ 
	2,2,2,	2,2,2,	0,0,0,	0,0,0,
	2,2,2,	2,2,2,	0,0,0,	0,0,0,
	2,2,2,	2,2,2,	1,1,1,	1,1,1,
	2,2,2,	2,2,2,	1,1,1,	1,1,1,
	2,2,2,	2,2,2,	1,1,1,	1,1,1,
	2,2,2,	2,2,2,	1,1,1,	1,1,1,
	1,1,1,	1,1,1,	2,2,2,	2,2,2,
	1,1,1,	1,1,1,	2,2,2,	2,2,2,
	1,1,1,	1,1,1,	2,2,2,	2,2,2,
	1,1,1,	1,1,1,	3,3,3,	3,3,3,
	1,1,1,	1,1,1,	3,3,3,	3,3,3,
	1,1,1,	1,1,1,	3,3,3,	3,3,3,
];
let Debug_Width = 12;
let Debug_Height = 12;


function httpRequest(Url,params, postData) 
{
	//	split url and path
	let UrlParts = URL.parse(Url);
	var params = 
	{
	    host: UrlParts.host,
	    path: UrlParts.path,
	    port: 80,
	    method: 'GET',
	};
	
    return new Promise(function(resolve, reject) 
    {
        var req = http.request(params, function(res) {
            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            // cumulate data
            var BodyData = [];
            res.on('data', function(chunk) {
                BodyData.push(chunk);
            });
            // resolve on end
            var Response = res;
            res.on('end', function() {
            	Response.body = BodyData;
                resolve(Response);
            });
        });
        // reject on request error
        req.on('error', function(err) {
            // This is not a "Second reject", just a different sort of failure
            reject(err);
        });
        if (postData) {
            req.write(postData);
        }
        // IMPORTANT
        req.end();
    });
}
async function GetFirstImgSrcUrl(Url)
{
	let Response = await httpRequest( Url );

	//	make it a string
	let ResponseBody = "" + Response.body;	
	//	find the img tag
	//var paragraph = 'The quick<img src="hello">e lazy dog.<img src="bye"> It barked.';
	let Img_Regex = /img src=\"([^\"]+)\"/;
	let Match = ResponseBody.match(Img_Regex);
	let ImgUrl = Match ? Match[1] : undefined;
	if ( ImgUrl === undefined )
		return null;
	return ImgUrl;
}

function GetGifByteArray(Image)
{
	var GifDataArray = [];
		
	//	make a gif!
	var Gif = new GifEncoder(Image.Width,Image.Height);
	Gif.colorTab = Image.Palette;
	Gif.writeHeader();
	Gif.writeLSD();
	Gif.writePalette();
		
	//	setup for frame
	//Gif.palSize = 0;
	Gif.colorDepth = 8;
	Gif.firstFrame = true;
	Gif.indexedPixels = Image.Colours;
	Gif.writeImageDesc();
	Gif.writePixels();
	Gif.finish();
	
	let writeByte = function(b)	{	GifDataArray.push(b);	};
	let WritePage = function(Page,PageIndex)
	{
		let PageLength = (PageIndex == Gif.out.page) ? Gif.out.cursor : Page.length;
		for ( let i=0;	i<PageLength;	i++ )
			writeByte( Page[i] );
	};
	Gif.out.pages.forEach(WritePage);
	
	return GifDataArray;
}

async function ParsePngToImage(PngData)
{
	throw "todo";
}

async function DecodeImage(ImgUrl)
{
	let ImgResponse = await httpRequest( ImgUrl );
	let ContentType = ImgResponse.headers['content-type'];
	if ( ContentType != "image/png" )
		throw "ContentType (" + ContentType + ") is not image/png"; 

	return ParsePngToImage(ImgResponse.body);

	let DebugImage = 
	{
		"Width":Debug_Width,
		"Height":Debug_Height,
		"Palette":Debug_Palette, 
		"Colours":Debug_Colours 
	};

	return DebugImage;
}

exports.handler = async (event) => 
{
	try
	{
		let ImageUrl = await GetFirstImgSrcUrl('http://webcomicname.com/tagged/oh-no/rss');
		
		let Image = await DecodeImage( ImageUrl );
	
		let GifByteArray = GetGifByteArray( Image );
		let GifBuffer = new Buffer( GifByteArray);
		let BinaryBase64 = GifBuffer.toString('base64');
	
		let ReturnDataUrl = true;
		if ( ReturnDataUrl )
		{
			const response = 
			{
				statusCode: 200,
				body: "data:image/gif;base64," + BinaryBase64,
			};
			return response;
		}
		
		const response = 
		{
			statusCode: 200,
			headers: {"content-type": "image/gif"},
			//	body: Gif.out,
			body: BinaryBase64,
			//contentHandling: "CONVERT_TO_BINARY"
		};
		return response;
		
	//	throw "xx";
	}
	catch(Error)
	{
		const response = {
			statusCode: 200,
			body: "Error: [" + (Error) + "]"
		};
		return response;
	}
};
