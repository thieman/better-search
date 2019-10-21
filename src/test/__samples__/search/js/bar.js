var bar = ['apple', 'banana', 'grapes', 'mango', 'orange'];

/**
 * Filter array items based on search criteria (query)
 */
function filterItems(arr, query) {
  return arr.filter(function(el) {
      return el.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  })
}

console.log(filterItems(bar, 'ap')); // ['apple', 'grapes']
console.log(filterItems(bar, 'an')); // ['banana', 'mango', 'orange']