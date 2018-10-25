var GifEncoder = require('./GifEncoder.js');
var Http = require('http');

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

exports.handler = async (event) => 
{
	try
	{
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
			body: "Error: " + Error
		};
		return response;
	}
};
