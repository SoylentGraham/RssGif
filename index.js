var GifEncoder = require('./GifEncoder.js');
var http = require('http');

let Palette = [ 0,255,255,	0,0,0,	255,0,0,	0,255,0,	255,255,0,	0,0,255,	255,0,255,	0,255,255,	255,255,255 ];
let Colours = [ 
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


function httpRequest(params, postData) 
{
    return new Promise(function(resolve, reject) {
        var req = http.request(params, function(res) {
            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            // cumulate data
            var body = [];
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            // resolve on end
            res.on('end', function() {
                resolve(body);
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
async function GetImageUrl(RssHost,RssUrl)
{
	var params = 
	{
	    host: RssHost,
	    port: 80,
	    method: 'GET',
	    path: RssUrl
	};
	let ResponseBody = await httpRequest( params );

	ResponseBody = "" + ResponseBody;	
	//	find the img tag
	//var paragraph = 'The quick<img src="hello">e lazy dog.<img src="bye"> It barked.';
	let Img_Regex = /img src=\"([^\"]+)\"/;
	let Match = ResponseBody.match(Img_Regex);
	let Url = Match ? Match[1] : undefined;
	if ( Url === undefined )
		return null;
	return Url;
}

exports.handler = async (event) => 
{
	try
	{
		let ImageUrl = await GetImageUrl('webcomicname.com','/tagged/oh-no/rss');
		throw ImageUrl;
		
		var GifDataArray = [];
		
		//	make a gif!
		var Gif = new GifEncoder(12,12);
		Gif.colorTab = Palette;
		Gif.writeHeader();
		Gif.writeLSD();
		Gif.writePalette();
		
		//	setup for frame
		//Gif.palSize = 0;
		Gif.colorDepth = 8;
		Gif.firstFrame = true;
		Gif.indexedPixels = Colours;
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

		//throw JSON.stringify( Gif.out );
		//throw "ByteCount="+ ByteCount;
		//throw "out.page=" + Gif.out.pages[0].cursor;	
		//throw "length=" + GifDataArray.length;
		
		let GifBuffer = new Buffer( GifDataArray );
		let BinaryBase64 = GifBuffer.toString('base64');
		//throw BinaryBase64;
	
		let ReturnBase64Image = true;
		if ( ReturnBase64Image )
		{
			const response = 
			{
				statusCode: 200,
				headers: {"content-type": "base64/gif"},
				//	body: Gif.out,
				body: BinaryBase64,
				//contentHandling: "CONVERT_TO_BINARY"
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
			body: "Error: " + (Error)
		};
		return response;
	}
};
