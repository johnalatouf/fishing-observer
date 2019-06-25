
<?php
    //dtfrom path mmsis dts_high dts_low split_val span


    // get the parameters from the ajax call
    // TODO - make sure all of these are properly cleaned for Solr
    $path = $_POST["path"];
    $pos1 = $_POST["pos1"];
    $pos2 = $_POST["pos2"];
    $span = $_POST["span"];

    $dts_low = $_POST["dts_low"];
    $dts_high = $_POST["dts_high"];
    $dtfrom = $_POST["dtfrom"];
    $mmsis = $_POST["mmsis"];

    $path = str_replace("'","",$path);

    //echo $pos1 . ' '. $pos2 . ' '. $dateto . ' '. $datefrom;

    /**
	 * returns time in microseconds as a number
	 */
	list($usec, $sec) = explode(" ", microtime());
	$microtime_float = ((float)$usec + (float)$sec);

	//TODO - this should just be python, the anaconda/bin is just for my computer
    $cmd = 'python '. 'get_ship_data.py' .' '. escapeshellarg($dtfrom) . ' '. escapeshellarg($path) . ' '. escapeshellarg($mmsis) . ' ' . escapeshellarg($dts_high) . ' ' . escapeshellarg($dts_low) . ' ' . escapeshellarg($span) . ' ' . escapeshellarg($pos1) . ' ' .  escapeshellarg($pos2);
    //echo $cmd
    exec($cmd . " 2>&1", $out, $status);


	echo implode($out);

?>