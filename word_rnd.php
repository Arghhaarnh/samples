<?php

    $encoding = 'utf-8';
    $encoded = false;
    $source = false;
    if (@$_GET['phrase']) {
        $source = $_GET['phrase'];
    } else if (@$_POST['phrase']) {
        $source = $_POST['phrase'];
    }
    if ($source) {
        $encoded = encode_rnd_phrase( $source );
    }
?>
<html lang="ru" xml:lang="ru" xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta content="text/html;charset=<?php echo $encoding; ?> ">
    </head>
    <body>
        <form method="POST" action="">
            <label for="phrase">Source phrase</label>
            <textarea cols="40" rows="10" name="phrase"><?php if ($source) echo $source; ?></textarea>
            <?php if ($encoded) : ?>
            <label for="encoded">Randomized phrase</label>
            <textarea cols="40" rows="10" name="encoded"><?php echo $encoded; ?></textarea>
            <?php endif ?>
            <input type="submit" value="Encode" />
        </form>
    </body>
</html>

<?php

// Get the string & randomize a symbols position in each word. 
// First & last symbols stay on it's places.
function encode_rnd_phrase( $src ) {
    global $encoding;
    $spec = array(',','.','-','"','\'',':','?','!', "\t", "\r", '«', '»');
    $src = explode( "\n", $src );
    foreach ( $src as $i => $paragraph ) {
        $paragraph_sec = explode( ' ', $paragraph );
        foreach ( $paragraph_sec as $j => $word ) {
            if ( 3 >= mb_strlen($word, $encoding) ) {
               continue;
            }
            for ( $start = 0;
                  in_array(mb_substr($word, $start, 1, $encoding), $spec);
                  $start++ );
            for ( $end = mb_strlen($word, $encoding)-1;
                  in_array(mb_substr($word, $end, 1, $encoding), $spec);
                  $end-- );
            if ( $end-$start <= 1 ) {
               continue;
            }
            $dest = mb_substr($word, 0, $start+1, $encoding);
            $char_map = range( $start+1, $end-1);
            shuffle( $char_map );
            foreach ( $char_map as $map_item ) {
                $dest .= mb_substr($word, $map_item, 1, $encoding);
            }
            $dest .= mb_substr($word, $end, mb_strlen($word, $encoding)-$end, $encoding);
            $paragraph_sec[$j] = $dest;
        }
        $src[$i] = implode( ' ', $paragraph_sec );
    }
    return implode( "\n", $src );
}
