
<?php
    //dtfrom path mmsis dts_high dts_low split_val span


    // get the parameters from the ajax call
    // TODO - make sure all of these are properly cleaned for Solr
    $path = $_POST["path"];
    $split_val = $_POST["split_val"];
    $span = $_POST["span"];
    $ourlabel = $_POST["ourlabel"];

    $dts_low = $_POST["dts_low"];
    $dts_high = $_POST["dts_high"];
    $dtfrom = $_POST["dtfrom"];
    $mmsis = $_POST["mmsis"];

    $color_key = "";

    if (array_key_exists ( "color_key" , $_POST )) {
        $color_key = $_POST["color_key"];
    }

    $path = str_replace("'","",$path);

    //echo $pos1 . ' '. $pos2 . ' '. $dateto . ' '. $datefrom;

    /**
	 * returns time in microseconds as a number
	 */
	list($usec, $sec) = explode(" ", microtime());
	$microtime_float = ((float)$usec + (float)$sec);

	if ($color_key != null && $color_key != '') {
	    //TODO - this should just be python, the anaconda/bin is just for my computer
        $cmd = 'python -W ignore '. 'build_ds_by_index.py' .' '. escapeshellarg($dtfrom) . ' '. escapeshellarg($path) . ' '. escapeshellarg($mmsis) . ' ' . escapeshellarg($dts_high) . ' ' . escapeshellarg($dts_low) . ' ' . escapeshellarg($split_val) . ' ' . escapeshellarg($span) . ' ' . escapeshellarg($ourlabel) . ' ' . escapeshellarg($color_key);
        //echo $cmd
        //echo "console.log( 'Debug Objects: " . $cmd . "' );";
        exec($cmd . " 2>&1", $out, $status);


        echo implode($out);
	} else {
        //TODO - this should just be python, the anaconda/bin is just for my computer
        $cmd = 'python -W ignore '. 'build_ds_by_index.py' .' '. escapeshellarg($dtfrom) . ' '. escapeshellarg($path) . ' '. escapeshellarg($mmsis) . ' ' . escapeshellarg($dts_high) . ' ' . escapeshellarg($dts_low) . ' ' . escapeshellarg($split_val) . ' ' . escapeshellarg($span) . ' ' . escapeshellarg($ourlabel);
        //echo $cmd
        //echo "console.log( 'Debug Objects: " . $cmd . "' );";
        exec($cmd . " 2>&1", $out, $status);


        echo implode($out);
	}



?>