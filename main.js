var pageCount = 1;
var pages = [document.getElementsByClassName("page")[0]];
var iRuleCount;

//handles internal link logic
var onInternalLinkPressed = function(e){
    var link = e.srcElement;
    var pageNum = link.dataset.pageNum;

    if (parseInt(pageNum) < pageCount){

        backTrack(parseInt(pageNum));
        reviveLinks(pageNum);
        var page = loadNewPage(link);
        animatePages(page);
        openNewPage();

    } else{
        var page = loadNewPage(link);
        animatePages(page);
        openNewPage();
        
    };

};

//creates and returns Page object made from linked HTML 
var loadNewPage = function(link){
//new section for the page to be shown in
    var newSection = document.createElement("section");

    //kill the link so user cant spawn duplicate pages
    killLink(link);

    //store page url as newPage
    var newPageHref = link.getAttribute("href");
    var newTitle;

    //use url to get info from newPage's html file
    fetch(newPageHref)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            doc.querySelectorAll("a.internal").forEach(function(el){
                updateLinkPageNum(el);
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
    
    //create a page object with the information we have
    var newId = "page-" + (pages.length + 1);
    var page = new Page(newSection, pages.length + 1, newId);
    return page
};

//animates open pages
var animatePages = function(page){

    var newSection = page.section;
    var ruleSheet = document.styleSheets[0]
    var rules = ruleSheet.cssRules;
    iRuleCount = rules.length

    ruleSheet.insertRule(`
        @keyframes shrink{
            from{
                flex: 0 0 0;
            }
            to{
                flex: 0 0 ` + 100/(pageCount + 1) + `%; 
            }
        }
    `, iRuleCount);

    document.styleSheets[0].cssRules = ruleSheet.cssRules;

    updatePageCount(newSection);

    newSection.style.animation = ".25s ease-out 1 normal shrink";
    newSection.style.position = "relative"
    newSection.classList.add("loaded", "page");

    newSection.addEventListener("animationend", resizePages);
};

//resizes open pages
var resizePages = function(e){
    document.styleSheets[0].deleteRule(iRuleCount);
    console.log(e.target);
    e.target.style.animation = "";
    e.target.style.flex = "1"
    e.target.removeEventListener("animationend", resizePages);
};

var openNewPage = function(){
    var newPage = pages[pageCount - 1];
    var container = document.getElementById("container");
    container.appendChild(newPage);
};

//sets site title
var setTitle = function(newTitle){
    document.title = newTitle;
}

//updates the PageCount var to match pages.length
var updatePageCount = function(newSection) {
   if (newSection){ 
        pageCount = pages.push(newSection);
   }else{
        pageCount = pages.length; 
   };
};

//assigns a page/section number to a link, based on curr pageCount
var updateLinkPageNum = function(link) {
    link.dataset.pageNum = pageCount;
};

//connect internal links in doc to onInternalLinkPressed() 
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

//kills link
var killLink = function(link) {
    link.classList.remove("live");
};

//reviveLinks
var reviveLinks = function(pageNum){
    document.querySelectorAll("a[data-page-num=\"" + pageNum + "\"").forEach(
        function(link){
            link.classList.add("live");
        }
    );
};

//deletes latest page until pageCount = pageNum
var backTrack = function(pageNum){
    while(pageCount > pageNum){
        lastPage = pages.pop();
        lastPage.remove();
        updatePageCount();
    };
};