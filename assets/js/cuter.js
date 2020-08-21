(function() {

    let all = 0;    
    let counter = document.querySelector('#counter'); // take the numbers of profile from counter in profile pages
    let yaCount =0; // count number of like
    let noCount =0; // count number of dislike
    let total = 0;
    let names = []; // will contain the names of liked people/profiles
    function updatecounter() {        // it will update the total number of profile  when click on like or dislike by -1   
        --all;
        counter.innerHTML = all;  // the number of counter in the page
    }

    document.body.addEventListener('yepcard', function() { // adding an event when click on like and add the name to the liked name Array
        yaCount++;   // will increase the counter of like     
        let fname1 = document.getElementsByName("fnamee")[0].value
        names.push(fname1); 
        //alert(fname1);  
        updatecounter();
    });

    document.body.addEventListener('nopecard', function() { //event to update counter of dislike and update the total counter of profile seen
        noCount++;
        updatecounter();
    });

    document.body.addEventListener('deckempty', function() {  // when all profile have seen and the container is empty
       if(noCount>0 && noCount == total){
           alert("sorry there are no more matches now");
       } 
       if(yaCount>0 && all==0){
        fetch('/liked', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({liked: names })
        })
       }
    });

    window.addEventListener('load', function() {      
        var listitems = document.body.querySelectorAll('.card');
        total=listitems.length;
        all = listitems.length + 1;
        updatecounter();
    });

})();