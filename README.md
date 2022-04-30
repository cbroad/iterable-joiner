# iterable-joiner

## What's included?

### Two **AsyncIterable** Joiner Implementations
- **IterableJoiner.Async.Equitable** - provides values from all AsyncIterables with the same priority.
- **IterableJoiner.Async.Priority** - provides values from all AsyncIterables with priority given to the first AsyncIterable with decreasing priority for each subsequent AsyncIterable.

### Two **Iterable** Joiner Implementations
- **IterableJoiner.Sync.Equitable** - provides values from all Iterables in a round-robin fashion.
- **IterableJoiner.Sync.Priority** - provides values from all Iterables exhausting each Iterator before continuing to the next.

### Abstract joiners
- Write your own algorithm for how to iterate through multiple iterators.


## Importing
```javascript
const { IterableJoiner } = require ( "iterable-joiner" );
```
```javascript
import { IterableJoiner } from "iterable-joiner";
```



# IterableJoiner.Async

## IterableJoiner.Async.Equitable.join( [ ... asyncIterables ] )
## IterableJoiner.Async.Priority.join( [ ... asyncIterables ] )
- **asyncIterables** <code>&lt;AsyncIterable[]&gt;</code> (optional) one or more asyncIterables that you want to join.
- Returns <code>&lt;AsyncIterable&gt;</code> an aggregation of the provided AsyncIterables.

## asyncJoiner.iterables
- a read-only in-order array of the iterables that have been added to the joiner 


## asyncJoiner.addIterable( asyncIterable[, idx ] )
- **asyncIterable** <code>&lt;AsyncIterable&gt;</code> the asyncIterable being added.
- **idx** <code>&lt;number&gt;</code> (optional) the index of the internal array to add the iterable at.  If idx>0, the value will be unshifted onto the front of the array, if idx>iterables.length, it will be pushed.  Default is to push to the end of the array.
- Returns <code>&lt;boolean&gt;</code> false if parameters have incorrect types or the asyncIterator has already been added 

## asyncJoiner.removeIterable( asyncIterable )
- **asyncIterable** <code>&lt;AsyncIterable&gt;</code> the asyncIterable being removed
- Returns <code>&lt;boolean&gt;</code> false if asyncIterator doesn't exist in the joiner 

<br />
<br />


# IterableJoiner.Sync

## IterableJoiner.Sync.Equitable.join( [ ... iterables ] )
## IterableJoiner.Sync.Priority.join( [ ... iterables ] )
- **iterables** <code>&lt;Iterable[]&gt;</code> (optional) one or more asyncIterables that you want to join.
- Returns <code>&lt;Iterable&gt;</code> an aggregation of the provided Iterables.

## syncJoiner.iterables
- a read-only in-order array of the iterables that have been added to the joiner 


## syncJoiner.addIterable( iterable[, idx ] )
- **iterable** <code>&lt;Iterable&gt;</code> the Iterable being added.
- **idx** <code>&lt;number&gt;</code> (optional) the index of the internal array to add the iterable at.  If idx>0, the value will be unshifted onto the front of the array, if idx>iterables.length, it will be pushed.  Default is to push to the end of the array.
- Returns <code>&lt;boolean&gt;</code> false if parameters have incorrect types or the iterator has already been added 

## syncJoiner.removeIterable( iterable )
- **iterable** <code>&lt;Iterable&gt;</code> the Iterable being removed
- Returns <code>&lt;boolean&gt;</code> false if Iterator doesn't exist in the joiner 



