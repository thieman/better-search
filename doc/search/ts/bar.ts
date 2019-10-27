// @ts-ignore
let suits = ["hearts", "spades", "clubs", "diamonds"];

// @ts-ignore
function bar(x): any {
    // Check to see if we're working with an object/array
    // if so, they gave us the deck and we'll pick the card
    if (typeof x == "object") {
        let pickedCard = Math.floor(Math.random() * x.length);
        return pickedCard;
    }
    // Otherwise just let them pick the card
    else if (typeof x == "number") {
        let pickedSuit = Math.floor(x / 13);
        return { suit: suits[pickedSuit], card: x % 13 };
    }
}

let myDeck = [{ suit: "diamonds", card: 2 }, { suit: "spades", card: 10 }, { suit: "hearts", card: 4 }];
let pickedCard1 = myDeck[bar(myDeck)];
// @ts-ignore
alert("card: " + pickedCard1.card + " of " + pickedCard1.suit);

let pickedCard2 = bar(15);
// @ts-ignore
alert("card: " + pickedCard2.card + " of " + pickedCard2.suit);