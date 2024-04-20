class Page {
    constructor(section, pageNum, id){
        this.section = section;
        this.pageNum = pageNum
        this.section.id = id
        this.section.classList.add("page")
    }

};