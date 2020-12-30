import express, { NextFunction } from 'express';
import { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import Jimp from 'jimp';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file

  app.get("/filteredimage/", async ( req : Request, res : Response) => {

    let { image_url } = req.query;

    if (!image_url) {
      return res.status(400).
      send("image url is required!");
    } else {
      Jimp.read(image_url.toString())
      .catch(error => {
        res.status(404).json({
          status: "resource not found!",
          error: error.message
        })
      });
    }

    const local_path = filterImageFromURL(image_url.toString());
    local_path.then(image_file_path => {
      res.on('finish', () => {deleteLocalFiles([image_file_path])});
        return res.status(200).sendFile(image_file_path);
    }).catch(error => {
      res.status(500).json({
            status: false,
            error: error.message
      })
    });
  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();