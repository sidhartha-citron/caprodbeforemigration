////// *
//
// Dashboard tabs
//
//// *

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("ma-tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" slds-is-active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " slds-is-active";
}

////// *
//
// Accordion Tables
//
//// *

var openAcc = document.getElementsByClassName("table-dropdown");
var i;

for (i = 0; i < openAcc.length; i++) {
  openAcc[i].onclick = function() {
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight){
      panel.style.maxHeight = null;
      this.closest('.slds-card').querySelector('.slds-card__footer').classList.add('out');
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
      this.closest('.slds-card').querySelector('.slds-card__footer').classList.remove('out');
    } 
  }
}