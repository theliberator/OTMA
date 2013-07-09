$(document).ready(function () {

	//if user clicked on button, the overlay layer or the dialogbox, close the dialog	
	// $('a.btn-ok, #dialog-overlay, #dialog-box').click(function () {		
		// $('#dialog-overlay, #dialog-box').hide();		
		// return false;
	// });
	
	// if user resize the window, call the same function again
	// to make sure the overlay fills the screen and dialogbox aligned to center	
	$(window).resize(function () {
		
		//only do it if the dialog box is not hidden
		if (!$('#dialog-box').is(':hidden')) popup2('root');		
	});	
	
	
});

// //Popup dialog
// function popup(message) {
		
	// // get the screen height and width  
	// var maskHeight = $(document).height();  
	// var maskWidth = $(window).width();
	
	// // calculate the values for center alignment
	// var dialogTop =  (maskHeight/3) - ($('#dialog-box').height());  
	// var dialogLeft = (maskWidth/2) - ($('#dialog-box').width()/2); 
	
	// // assign values to the overlay and dialog box
	// $('#dialog-overlay').css({height:maskHeight, width:maskWidth}).show();
	// $('#dialog-box').css({top:dialogTop, left:dialogLeft}).show();
	
	// // display the message
	// $('#dialog-message').html(message);
			
// }

//Popup dialog with div as parameter
function popup2(pageId) {
		
	// get the screen height and width  
	var maskHeight = $(document).height();  
	var maskWidth = $(window).width();
	
	// calculate the values for center alignment
	var dialogTop =  (maskHeight/3) - ($('#dialog-box').height());  
	var dialogLeft = (maskWidth/2) - ($('#dialog-box').width()/2); 
	
	// assign values to the overlay and dialog box
	$('#dialog-overlay').css({height:maskHeight, width:maskWidth}).show();
	$('#dialog-box').css({top:dialogTop, left:dialogLeft}).show();
	
	loadDialogPage(pageId);			
}

var xmlParsed = false;
var CurrentDialogPageData;
var currentPageId;
var XMLConfig;

function loadDialogPage(pageId) {
    currentPageId = pageId;
	
	if(!xmlParsed) {
		XMLConfig = new XMLConfigLoader();
		XMLConfig.loadBranchedDialogXML("branchedDialogExampleData.xml", loadCurrentDialogPage);
    }
	else {	
		loadCurrentDialogPage();
	}
}

function loadCurrentDialogPage() {
	
	xmlParsed = true;
	
	resetDialogContent();
	CurrentDialogPageData = XMLConfig.otma.dialogPageCollection.getDialogPageById(currentPageId);	
	
	$('#dialog-message').text(CurrentDialogPageData.message);	    
	
	if(CurrentDialogPageData.options.length == 0) {
		$('#dialog-buttons').append(createDeadEndButton()); 
	}
	else {
		for(var i = 0; i < CurrentDialogPageData.options.length; i++) {
			var option = CurrentDialogPageData.options[i];      
			
			if(option instanceof Answer) {  		
				$('#dialog-buttons').append(createAnswerButton(option, i));  
			}
			else if(option instanceof Hint) {                        
				$('#dialog-buttons').append(createHintButton(option, i)); 
			}
		}
	}
}

function resetDialogContent() {
	$('#dialog-message').empty();
	$('#dialog-buttons').empty();
}

// begin: createXButton

function createDeadEndButton() {
	var btn = document.createElement('button');
    btn.setAttribute('type', 'button');         
    btn.setAttribute('id', 'btn_dead_end');
	btn.setAttribute('class', 'dlg-button');
	btn.setAttribute('onClick', 'btnDeadEndClick()');	
    btn.innerHTML = 'Zurueck zum Anfang';
	return btn;
}

function createHintButton(hint, index) {
	var btn = document.createElement('button');
    btn.setAttribute('type', 'button');         
    btn.setAttribute('id', 'btn-hint-' + intToLowerCaseChar(index));
	btn.setAttribute('class', 'dlg-button');
	btn.setAttribute('onClick', 'btnHintClick()');	
    btn.innerHTML = hint.text;
	return btn;
}

function createAnswerButton(answer, index) {	
	var btn = document.createElement('button');
    btn.setAttribute('type', 'button');         
    btn.setAttribute('id', 'btn-answer-' + intToLowerCaseChar(index));
	btn.setAttribute('class', 'dlg-button');
	btn.setAttribute('onClick', 'btnAnswerClick(\'' + answer.id + '\')');	
    btn.innerHTML = answer.text;
	return btn;
}

function intToLowerCaseChar(i) {
	return String.fromCharCode(97 + i);
}

// end: createXButton

// begin: button click events

function btnAnswerClick(answerId) {
    var answer = getOptionById(answerId);
    loadDialogPage(answer.successor);
}

function getOptionById(id) {    
    for(var i = 0; i < CurrentDialogPageData.options.length; i++) {
		var option = CurrentDialogPageData.options[i];
		
        if(option.id == id) {
            return option;
        }
    }
}

function btnHintClick() {
    loadDialogPage('root');  
}

function btnDeadEndClick() {
    loadDialogPage('root');  
}

// end: button click events

