var pageCount = 1;
var pages = [document.getElementsByClassName("page")[0]];
var iRuleCount;
var tilt = window;
window.matchMedia("(orientation: portrait)").addEventListener("change", ondeviceorientation)

var ondeviceorientation = function(w, e) {
    console.log(e);
};

//handles internal link logic
var onInternalLinkPressed = function(e){
    console.log(window)
    var link = e.srcElement;
    var pageNum = link.dataset.pageNum;

    //backtrack if link is on a prev page
    if (parseInt(pageNum) < pageCount){

        backTrack(parseInt(pageNum));
        reviveLinks(pageNum);
    
    }; 

    //open new page
    var page = loadNewPage(link);
    updatePageCount(page);
    openNewPage();
        

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
    var page = new Page(newSection, pages.length + 1, newId, newTitle);
    return page
};

var addAnimationToTarget = function(action, element){
    var animTime;
    if (action === "close"){animTime = ".1s"}else{animTime = ".25s"}
    element.style.animation = animTime + " ease-out 1 normal " + action;
    element.style.position = "relative"
    element.addEventListener("animationend", onAnimEnd);
};

//animate newly opened/closed pages.
var animatePages = function(action, page){
    //load CSS rules
    var ruleSheet = document.styleSheets[0]
    var rules = ruleSheet.cssRules;
    iRuleCount = rules.length

    if (action === "open"){
        page.type = "Page"
        var newSection = page.section;

        ruleSheet.insertRule(`
            @keyframes open{
                from{
                    flex: 0 0 0;
                }
                to{
                    flex: 0 0 ` + 100/(pageCount) + `%; 
                }
            }
        `, iRuleCount);

        newSection.classList.add("loaded", "page");

        addAnimationToTarget(action, newSection);

    } else if (action === "close") {
        page.type = "Array/Page";
        ruleSheet.insertRule(`
            @keyframes close{
                from{
                    flex: 0 0 ` + 100/(pageCount + page.length + 1) + `%; 
                }
                to{
                    flex: 0 0 0; 
                }
            }
        `, iRuleCount);

        page.forEach(function(target){
            addAnimationToTarget("close", target.section);
        });

    };

    document.styleSheets[0].cssRules = ruleSheet.cssRules;
};

//updates pages to reflect changes made by animation
//e.g. closes closed pages and sets width of open ones
var onAnimEnd = function(e){
    if (document.styleSheets[0][iRuleCount]){
        document.styleSheets[0].deleteRule(iRuleCount);
    };
    console.log(e.target);
    e.target.style.animation = "";
    e.target.removeEventListener("animationend", onAnimEnd);
    if (e.target.classList.contains("closing")){
        e.target.remove();
    };
    e.target.style.animation = "";
    e.target.style.flex = "1";
    e.target.removeEventListener("animationend", onAnimEnd);
};

var openNewPage = function(){
    var newPage = pages[pageCount - 1];
    console.log(newPage);
    animatePages("open", newPage);
    var container = document.getElementById("container");
    container.appendChild(newPage.section);
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
    var removedPages = [];
    while(pageCount > pageNum){
        lastPage = pages.pop();
        lastPage.section.classList.add("closing");
        removedPages.push(lastPage);
        updatePageCount();
    };

    animatePages("close", removedPages);
};