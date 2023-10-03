// The database config for my Firebase acct
var config = {
  apiKey: 'AIzaSyB3OTKnscA9uQXfdcKUkuPOANkEF-lUVA0',
  authDomain: 'projectcodingcamp.firebaseapp.com',
  databaseURL: 'https://projectcodingcamp.firebaseio.com',
  projectId: 'projectcodingcamp',
  storageBucket: 'projectcodingcamp.appspot.com',
  messagingSenderId: '277978229879',
};

// Inititalize the database
firebase.initializeApp(config);

// Assign my database ref for folder TrainScheduler to a variable
var db = firebase.database();
var jjdb = db.ref('TrainScheduler');

// Assign the connections to database to a variable
var connectionsRef = db.ref('/connections');

// '.info/connected' is a special location provided by Firebase that is updated
// every time the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = db.ref('.info/connected');

// When the client's connection state changes...
connectedRef.on('value', function (snap) {
  // If they are connected..
  if (snap.val()) {
    // Add user to the connections list.
    var con = connectionsRef.push(true);
    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove();
  }
});

// A f(X) for passing a category query and get the json object from the Giphy API
function queryGiphy(cat) {
  var queryURL = `https://api.giphy.com/v1/gifs/search?q=${cat}&api_key=dc6zaTOxFJmzC&limit=1`;

  $.ajax({
    url: queryURL,
    method: 'GET',
  }).then(function (response) {
    // Write a new Gif card to window with the returned gif attached
    var newGifDiv = $('<div class="card gif-card" style="width:100%;">');
    newGifDiv.append(
      '<img class= "img-responsive" src="' +
        response.data[0].images.original.url +
        '" frameBorder="0" class = "card-img-top my-img" data-animate="' +
        response.data[0].images.original.url +
        '" data-still="' +
        response.data[0].images.original_still.url +
        '" data-state="animate" allowFullScreen></iframe>'
    );
    $('#gifrow').append(newGifDiv);
  });
}
// Call the giphy function and pass it a specific train search
queryGiphy('train station');

var arrTrainKeys = ['Train', 'Destination', 'StartTime', 'Freq'];

function handleArr(arr) {
  for (x in arr) {
    return x;
  }
}

// Initialize the train data to empty at page load
var newName = '';
var newDest = '';
var newTime = 0;
var newRawFreq = '';

// A dummy variable to keep track of the trains added (for future use)
var numTrains = 0;

function reprintTable() {
  $('tbody').empty();
  readFromDb();
}

// A f(x) for pushing each user inputed train and its data to the database
function addTrainToDB(name, dest, time, freq) {
  jjdb.child(name).set(
    {
      Train: name,
      Destination: dest,
      StartTime: time,
      Freq: freq,
      dateAdded: firebase.database.ServerValue.TIMESTAMP,
    },
    function () {
      console.log(`Added ${name}`);
      reprintTable();
    }
  );
}

function removeTrainFromDB(name, cb) {
  jjdb
    .orderByChild('Train')
    .equalTo(name)
    .once('value')
    .then((snapshot) => {
      snapshot.forEach(function (childSnapshot) {
        jjdb.child(childSnapshot.key).remove();
      });
      cb();
    });
}

// Capture Submit Click
$('#add-train').on('click', function (event) {
  event.preventDefault();

  // Grab all the train info from the user inputs and assign to global train variables
  newName = $('#name-input').val().trim();
  newDest = $('#dest-input').val().trim();
  newTime = $('#time-input').val();
  newRawFreq = $('#min-input').val().trim();

  // Code for the push and then calling the database function for printing all current trains
  addTrainToDB(newName, newDest, newTime, newRawFreq);

  // Reset the input fields
  $('input').val('');
});

// Capture the update button click
$('tbody').on('click', '#update', function (event) {
  event.preventDefault();

  // Get the train name that user wants to update and remove spaces
  var update_Name = $(this).attr('data-name');
  var update_id = update_Name.replace(/\s+/g, '');

  // Make a new set of local variables for train info and default to blank
  var updateName = '';
  var updateDest = '';
  var updateTime = 0;
  var updateRawfreq = '';

  // Check to see if the train is currently being updated
  if ($(this).attr('update-activated') == 'false') {
    // If not empty the current data row
    $('#' + update_id + ' td:nth-child(1)')
      .empty()
      .append(
        '<input class="form-control" id="update-name-input" style="width:70%;margin:0 auto;" type="text">'
      );
    $('#' + update_id + ' td:nth-child(2)')
      .empty()
      .append(
        '<input class="form-control" id="update-dest-input" style="width:70%;margin:0 auto;" type="text">'
      );
    $('#' + update_id + ' td:nth-child(3)')
      .empty()
      .append(
        '<input class="form-control" id="update-time-input" type="time">'
      );
    $('#' + update_id + ' td:nth-child(4)')
      .empty()
      .append(
        '<input class="form-control" id="update-min-input" style="width:70%;margin:0 auto;" type="text">'
      );
    $('#' + update_id + ' td:nth-child(5)').empty();
    $('#' + update_id + ' td:nth-child(6)').empty();
    // Set the update data boolean to true
    $(this).attr('update-activated', 'true');
  }

  // If currently being updated and submit is clicked
  else {
    // Get the updated train info
    updateName = $('#update-name-input').val().trim();
    updateDest = $('#update-dest-input').val().trim();
    updateRawfreq = $('#update-min-input').val().trim();
    updateTime = $('#update-time-input').val();

    // As long as the train name isnt blank then find the current train in database and replace
    if (!(updateName == '')) {
      removeTrainFromDB(updateName, function () {
        addTrainToDB(updateName, updateDest, updateTime, updateRawfreq);
      });
    }
  }
});

// Capture the cancel button click
$('tbody').on('click', '#cancel', function (event) {
  event.preventDefault();

  // Grab the name of the train name to be deleted
  var del_name = $(this).attr('data-name');
  console.log(del_name);

  // Remove the selected train from the database
  removeTrainFromDB(del_name, reprintTable);
  $('.show').remove();
});

// A debugging f(x) for console logging each current database train object
function consoleTrain(child) {
  handleArr(arrTrainKeys);
  console.log(child.val().Train);
  console.log(child.val().Destination);
  console.log(child.val().StartTime);
  console.log(child.val().Freq);
  console.log(child.val().dateAdded);
}

// A f(x) for printing each train and its data to the html
function printTrain(child, next, min) {
  numTrains++;
  console.log(numTrains);
  var tr = $('<tr id="' + child.val().Train.replace(/\s+/g, '') + '"</tr>');
  tr.append('<td>' + child.val().Train + '</td>');
  tr.append('<td>' + child.val().Destination + '</td>');
  tr.append('<td>' + child.val().StartTime + '</td>');
  tr.append('<td>' + child.val().Freq + '</td>');
  tr.append('<td>' + next + '</td>');
  tr.append('<td>' + min + '</td>');
  var btnRow = $('<td style="width: 180px;"></td>');
  btnRow.append(
    '<button id="update" type="button" class="btn btn-primary btn-sm" data-name="' +
      child.val().Train +
      '" update-activated = "false" style="margin:0 8px 4px 0;">Update</button>'
  );
  btnRow.append(
    '<button id="cancel" type="button" class="btn btn-primary btn-sm" style="margin:0 0 4px 8px;" data-toggle="tooltip" data-placement="auto" data-trigger="hover" data-name="' +
      child.val().Train +
      '" title="Will take a sec">Remove</button>'
  );
  tr.append(btnRow);
  $('tbody').append(tr);
}

// The main f(x) for taking each stored train and calculating its next time to and of arrival
function calcNextTrain(childSnap) {
  var momMidnight = moment('00:00', 'HH:mm');
  var momStartTime = moment(childSnap.val().StartTime, 'HH:mm');

  // Calculate the time elapsed from the first train time till now
  var totalMinNow = moment(moment()).diff(momStartTime, 'minutes');

  // Convert the first train time to elapsed min from midnight
  var firstTime = moment(momStartTime).diff(momMidnight, 'minutes');

  // Calculate the current mins away by subtracting the remainder of (time elapsed from start/frequency) from the interval
  if (totalMinNow >= 0) {
    var curMinAway =
      childSnap.val().Freq - (totalMinNow % parseInt(childSnap.val().Freq));
  } else {
    var curMinAway = Math.abs(totalMinNow % parseInt(childSnap.val().Freq));
  }

  // Set the next train time in minutes to the time elapsed from start plus mins away plus the first time it ran in mins
  var nextTime = totalMinNow + curMinAway + firstTime;

  // Convert the next train time to a moment of adding the next train time in mins to midnight
  var nextTimeMom = momMidnight.add(nextTime, 'minutes').format('HH:mm');

  // Call the print all train data f(x) including our calculated next time in correct format and time away to html
  printTrain(childSnap, nextTimeMom, curMinAway);
}

// Set an interval variable
var intervalId;

// A f(x) for setting event child added handler to the database
function readFromDb() {
  numTrains = 0;
  jjdb.orderByChild('Destination').on(
    'child_added',
    function (snapshot) {
      // Log everything that's coming out of each train child snapshot
      // consoleTrain(snapshot);
      console.log('printed trains');
      // Call the f(x) for printing the train info and pass the train snapshot
      calcNextTrain(snapshot);
      // Turn off the child handler after 1 sec to prevent stacking handlers
      setTimeout(jjdb.off(), 1000);

      // Handle the errors
    },
    function (errorObject) {
      console.log('Errors handled: ' + errorObject.code);
    }
  );
}

// Call the database function to print current trains upon page load
readFromDb();
// Call the database function to print current trains every min to update real-time
setInterval(function () {
  $('tbody').empty();
  readFromDb();
}, 1000 * 60);

// Print the current time to the html initially and every subsequent second
$('#nowTime').text(moment().format('MMMM Do YYYY HH:mm:ss'));

setInterval(function () {
  $('#nowTime').text(moment().format('MMMM Do YYYY HH:mm:ss'));
}, 1000);

$('body').tooltip({ selector: '[data-toggle="tooltip"]' });

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});
