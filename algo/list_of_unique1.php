<?php

/**
 * Task: Num array given. 
 *       Get the min length of sequence that includes all 
 *        the possible elem values at least once.
 */


$in = array( 4, 5, 1, 2, 10, 3, 4, 5);

$solver = new Solver();
$min = $solver->solve($in);

echo( "\n\nIn: (".implode(', ',$in).")\nOut: $min\n\n");


class Solver {

    // index array, contain count of values in current sequence
    private $__valuesCountList;
    private $__sStart; // sequence start index
    private $__sEnd; // sequence end index
    
    private $__valuesCountMem; // return point for nex seq
    
    public function solve( $in ) {
        $this->__getCountBase( $in );
        // get uniques set (count = 1)
        // exclude all inside u-set
        // get maximum set (2 versions) ?  (really we'll get a set of pairs, which needs to be combined)
            // get pairs with mark: the max delta it eats for other side (en economy value)
            // combine it from upper deltas to lower
    }
    
    /**
     * Create list of all the elements value
     * @param type $in
     */
    private function __getCountBase( $in ) {
        $this->__valuesCountList = array();
        foreach ( $in as $elem ) {
            if (array_key_exists( $elem, $this->__valuesCountList )) {
                $this->__valuesCountList[$elem]++;
            } else {
                $this->__valuesCountList[$elem] = 1;
            }
        }
    }

}