class CheckPoint {
  // keep position information for highlight

  // constant
  CHECK_POINT_TYPE_START = 0; // start
  CHECK_POINT_TYPE_END = 1; // end

  constructor(node, index, type) {
    this.node = node;
    this.index = index;
    this.type = type;
  }
}

class CheckString {
  // match with search string

  // constant
  RESULT_NOT_HIT = 0; // no match
  RESULT_PART_HIT = 1; // maching
  RESULT_ALL_HIT = 2; // match complete

  // for constant acquisition of child class
  CHECK_POINT_CONST = new CheckPoint(null, 0, 0);

  #intMaxLength = 0; // final position of search keyword

  points = []; // Stores the positions for highlighting Array of CheckPoint class
  previousNode = null; // previous node

  constructor(strSearch) {
    this.strSearch = strSearch;
    this.intMaxLength = strSearch.length;
    this.intCurrentSearchIndex = 0; // Position of matching character
    this.previousNode = null;
    this.points = [];
  }

  // public
  check(textNode, index) {
    // check one character
    let blnNodeChange = false;
    let char = textNode.textContent.charAt(index);

    if (this.previousNode !== textNode) {
      this.previousNode = textNode;
      blnNodeChange = true;
    }

    if (this.intCurrentSearchIndex == 0) {
      this.points = []; // reset the first time
      this.points.push(
        new CheckPoint(
          textNode,
          index,
          this.CHECK_POINT_CONST.CHECK_POINT_TYPE_START
        )
      );
    } else {
      if (blnNodeChange) {
        // Put the end of the previous element and the start of the current element if different from the previous element

        this.points.push(
          new CheckPoint(
            this.points[this.points.length - 1].node,
            this.points[this.points.length - 1].node.textContent.length - 1,
            this.CHECK_POINT_CONST.CHECK_POINT_TYPE_END
          )
        );

        this.points.push(
          new CheckPoint(
            textNode,
            index, // should be 0
            this.CHECK_POINT_CONST.CHECK_POINT_TYPE_START
          )
        );
      }
    }

    if (this.strSearch.charAt(this.intCurrentSearchIndex) == char) {
      this.intCurrentSearchIndex++;
      if (this.intCurrentSearchIndex == this.intMaxLength) {
        // finished checking everything
        this.points.push(
          new CheckPoint(
            textNode,
            index,
            this.CHECK_POINT_CONST.CHECK_POINT_TYPE_END
          )
        );

        this.intCurrentSearchIndex = 0; // reset
        return this.RESULT_ALL_HIT;
      } else {
        return this.RESULT_PART_HIT;
      }
    } else {
      this.intCurrentSearchIndex = 0;
      return this.RESULT_NOT_HIT;
    }
  }

  // public
  getCheckPoints() {
    // return checkpoint list
    return this.points;
  }
}

class ScanNode {
  // traverse the element and return the character

  constructor(elRoot) {
    this.elRoot = elRoot;
    this.textNodes = null;
    this.intNodeIndex = 0;
    this.intStringIndex = -1;
    this.position = null;
  }

  // private
  getTextNodes(node) {
    // get a sequence of text nodes
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        // don't search inside script and style tags
        switch (node.tagName) {
          case "SCRIPT":
          case "STYLE":
            break;
          default:
            for (let i = 0; i < node.childNodes.length; i++) {
              this.getTextNodes(node.childNodes[i]);
            }
        }
        break;
      case Node.TEXT_NODE:
        this.textNodes.push(node);
        break;
      default:
        // ignore
        break;
    }
  }

  // public
  next() {
    if (this.textNodes == null) {
      // memorize the text nodes in the order they appear the first time
      this.textNodes = []; // reset
      this.getTextNodes(this.elRoot);
    }

    // find the next character and return its meta information (textnode and character index)
    // return null if all characters are over
    if (this.textNodes.length <= this.intNodeIndex) {
      return null;
    } else {
      this.intStringIndex++;
      if (
        this.intStringIndex <
        this.textNodes[this.intNodeIndex].textContent.length
      ) {
        return {
          node: this.textNodes[this.intNodeIndex],
          index: this.intStringIndex,
        };
      } else {
        // find next text node
        this.intStringIndex = -1;
        this.intNodeIndex++;
        return this.next();
      }
    }
  }

  // public
  savePosition() {
    this.position = {
      node: this.intNodeIndex,
      string: this.intStringIndex,
    };
  }
  // public
  clearPosition() {
    this.position = null;
  }
  // public
  backToSavedPosition() {
    if (this.position) {
      this.intNodeIndex = this.position.node;
      this.intStringIndex = this.position.string;
    }
  }
}

class HighlightString {
  // string search main

  // for constant acquisition of child class
  CHECK_POINT_CONST = new CheckPoint(null, 0, 0);

  // public
  getOriginalData() {
    // return the original value
    if (this.original) {
      return this.original;
    } else {
      return null;
    }
  }

  // public
  highlightString(
    strSearch,
    elTarget = document.querySelector("body"),
    strWrapTagName = "span",
    strWrapClassName = "highlight"
  ) {
    // save the original value
    this.original = elTarget.cloneNode(true);
    this.strWrapClassName = strWrapClassName;
    this.strWrapTagName = strWrapTagName;
    let elResult = elTarget.cloneNode(true); // return value
    let check = new CheckString(strSearch);
    let scan = new ScanNode(elResult);
    let checkPoints = []; // list of highlights
    let intPrevStatus = 0;
    let intCurrentStatus = 0;

    while (true) {
      let r = scan.next();

      if (r == null) {
        break;
      }

      intCurrentStatus = check.check(r.node, r.index);
      // character check
      switch (intCurrentStatus) {
        case check.RESULT_ALL_HIT:
          // characters found
          switch (intPrevStatus) {
            case check.RESULT_ALL_HIT:
            case check.RESULT_PART_HIT:
            case check.RESULT_NOT_HIT:
            default:
              // save result
              checkPoints = checkPoints.concat(check.getCheckPoints());
              // Since there is a hit, scan from the next character
              scan.clearPosition();
              break;
          }
          break;
        case check.RESULT_PART_HIT:
          // partial character found
          switch (intPrevStatus) {
            case check.RESULT_ALL_HIT:
            case check.RESULT_NOT_HIT:
              // If it hits partially for the first time, remember the location, start from the next location remembered when it fails
              // If there is "aaab" when searching for "aab", it cannot be picked up by searching from the failed character
              scan.savePosition();
              break;
            case check.RESULT_PART_HIT:
            // Do nothing if it's a continuation from the previous time
            default:
              break;
          }
          break;
        case check.RESULT_NOT_HIT:
          switch (intPrevStatus) {
            case check.RESULT_PART_HIT:
              // Reverse the search position if it was found until the previous time
              scan.backToSavedPosition();
              break;
            case check.RESULT_ALL_HIT:
            case check.RESULT_NOT_HIT:
            default:
              // Reset position just in case
              // scan.clearPosition();
              break;
          }
          break;
        default:
      }
      intPrevStatus = intCurrentStatus;
    }

    // Element insertion process
    this.reflect(checkPoints);

    // Reconstruct and return the element from checked
    return elResult;
  }

  // private
  reflect(checkPoints) {
    // element insertion main (reflected by text node)
    let checkPointsWk = [];
    let preNode = null;

    for (let i = 0; i < checkPoints.length; i++) {
      if (preNode !== checkPoints[i].node) {
        this.reflectSub(checkPointsWk);
        checkPointsWk = [];
      }
      checkPointsWk.push(checkPoints[i]);
      preNode = checkPoints[i].node;
    }
    this.reflectSub(checkPointsWk);
  }

  // private
  reflectSub(checkPointsWk) {
    // element insertion sub
    if (checkPointsWk.length == 0) {
      return;
    }
    let nodes = [];
    let strWk = "";
    let intOffset = 0;
    let blnStart = false;
    let text = checkPointsWk[0].node.textContent;

    // node creation
    for (let i = 0; i < checkPointsWk.length; i++) {
      switch (checkPointsWk[i].type) {
        case this.CHECK_POINT_CONST.CHECK_POINT_TYPE_START:
          if (blnStart) {
            console.log("irregular value on 'type start' exception");
            // continued start is not expected
          } else {
            // Characters before start are normal text
            strWk = text.substring(intOffset, checkPointsWk[i].index);
            if (strWk !== "") {
              nodes.push(document.createTextNode(strWk));
            }
          }
          blnStart = true;
          intOffset = checkPointsWk[i].index;
          break;
        case this.CHECK_POINT_CONST.CHECK_POINT_TYPE_END:
          // Since it is the index value of the end character, +1 is required when getting it with subsring
          if (blnStart) {
            strWk = text.substring(intOffset, checkPointsWk[i].index + 1);
            if (strWk !== "") {
              let el = document.createElement(this.strWrapTagName);
              el.classList.add(this.strWrapClassName);
              el.textContent = strWk;
              nodes.push(el);
            }
          } else {
            console.log("irregular value on 'type end' exception");

            // Unexpected if it doesn't start, added as normal text
            strWk = text.substring(intOffset, checkPointsWk[i].index + 1);
            if (strWk !== "") {
              nodes.push(document.createTextNode(strWk));
            }
          }
          blnStart = false;
          intOffset = checkPointsWk[i].index + 1;
          break;
        default:
          console.log("irregular value on 'type' exception");
      }
    }
    if (blnStart) {
      console.log("irregular value on 'end not exists' exception");
    }
    strWk = text.substring(intOffset);
    if (strWk !== "") {
      nodes.push(document.createTextNode(strWk));
    }

    // insert into element
    let parent = checkPointsWk[0].node.parentNode;
    for (let i = 0; i < nodes.length; i++) {
      parent.insertBefore(nodes[i], checkPointsWk[0].node);
    }
    // Since we split the original text node and set it anew,delete the original textnode
    checkPointsWk[0].node.remove();
  }
}
