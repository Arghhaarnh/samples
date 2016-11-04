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
    $matches = [];
    $replaces = [];
    mb_regex_encoding($encoding);
    mb_ereg_search_init($src, '\w{4,}'); // search multibyte words
    $res = mb_ereg_search();
    if ($res) {
        $res = mb_ereg_search_getregs();
        while ($res) {
            $first = mb_substr($res[0], 0, 1, $encoding);
            $last = mb_substr($res[0], -1, 1, $encoding);
            $chars0 = mb_substr($res[0], 1, mb_strlen($res[0], $encoding)-2, $encoding);
            $chars1 = preg_split( '//u', $chars0, null, PREG_SPLIT_NO_EMPTY); // mb string to array
            shuffle( $chars1 );
            $chars1 = implode( '', $chars1 );
            if ($chars0 != $chars1) {
                $replaces[$first.$chars0.$last] = $first.$chars1.$last;
            }
            $res = mb_ereg_search_regs();
        }
    }
    return strtr($src, $replaces);
}
