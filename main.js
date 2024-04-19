var pageCount = 1;
var pages = [0];

var onInternalLinkPressed = function(e){
    var link = e.srcElement;
    if (parseInt(link.dataset.pageNum) < pageCount){
        backTrack(link, parseInt(link.dataset.pageNum));
    } else{
        openNewPage(link);
    };

};

var openNewPage = function(link){
//new section for the page to be shown in
    var newSection = document.createElement("section");

    //kill the link so user cant spawn duplicate pages
    killLink(link);

    //store page url as newPage
    var newPage = link.getAttribute("href");
    var newTitle;

    //use url to get info from newPage's html file
    fetch(newPage)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            doc.querySelectorAll("a.internal").forEach(function(el){
                updatePageNum(el);
            });

            //get content from html and add to page
            const contentEl = doc.getElementById("content")
            newSection.innerHTML = contentEl.innerHTML;

            //update title with title from new page
            const titleEl = doc.getElementsByTagName("title");
            newTitle = titleEl[0].textContent;
            setTitle(newTitle); 

        })
        .catch(error => {
            console.error("Error loading entry: ", error);
        });

    //show newPage and update metadata
    document.body.appendChild(newSection);
    newSection.id = "page-" + (pages.length + 1);
    newSection.className = "page"
    updatePageCount(newSection);
};

var setTitle = function(newTitle){
    document.title = newTitle;
}

var updatePageCount = function(newSection) {
   if (newSection){ 
        pageCount = pages.push(newSection);
   }else{
        pageCount = pages.length; 
   };
};

var updatePageNum = function(link) {
    link.dataset.pageNum = pageCount;
};

var connectInternalLinks = function(liveOnly) {
    document.addEventListener("click", function(e){
        if(e.target.matches("a.internal.live")) {
            e.preventDefault();
            onInternalLinkPressed(e);
        } else if(e.target.matches("a.internal")){
            e.preventDefault();
        };
    });
};

var killLink = function(link) {
    link.classList.remove("live");
};

var reviveLinks = function(pageNum){
    document.querySelectorAll("a[data-page-num=\"" + pageNum + "\"").forEach(
        function(link){
            link.classList.add("live");
        }
    );
};

var backTrack = function(link, pageNum){
    while(pageCount > pageNum){
        lastPage = pages.pop();
        lastPage.remove();
        updatePageCount();
    };
    reviveLinks(pageNum);
    openNewPage(link);
};