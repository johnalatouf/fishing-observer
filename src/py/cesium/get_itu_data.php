
<?php
    //dtfrom path mmsis dts_high dts_low split_val span

    $mmsis = $_POST["mmsis"];


    /**
	 * returns time in microseconds as a number
	 */
	list($usec, $sec) = explode(" ", microtime());
	$microtime_float = ((float)$usec + (float)$sec);

	//TODO - this should just be python, the anaconda/bin is just for my computer
    $cmd = 'python '. 'get_itu_data.py' .' '. escapeshellarg($mmsis);
    //echo $cmd
    exec($cmd . " 2>&1", $out, $status);


	echo implode($out);

?>