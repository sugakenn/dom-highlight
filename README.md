# dom-highlight
Pure JS and small script that inserts elements for highlight to the DOM

JavaScriptで文字を検索してハイライト用の要素を付与するコードです。日本語の解説は[ブログ:「ブラウザのHTMLをJSで動的にハイライト」](https://nanbu.marune205.net/2022/12/html-highlight-with.html?m=1)に載せています。


# Usage

1. code download

   Please download the dist/dom-highlight.min.js file on this site.

2. Import on HTML

   Load that script somewhere in the head or body of your HTML.

3. Add to script

   Write a script for processing, write it in a place that will be executed after the js file is loaded.

   Call the highlightString method from an instance of HighlightString.

   The argument at this time is as follows.

   - Search target character (required)
   - Search target element
  
      If omitted, the first body element will be searched.

   - decorative elements
   
      Set the tag name of the element to decorate the found characters. The default is span.
      
   - decoration class

      Set the class name of the element to decorate the found characters. Default is highlights.

   Returns an element that clones the original element and adds an element for highlighting to the return value.

   If you call the getOriginalData method after executing the highlightString method, you can get a clone of the element in the previous generation.

4. CSS settings

     Set any CSS to the element set for highlighting and the class.

# An example usage would be:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      span.highlight {
        background-color: blue;
      }
    </style>
  </head>
  <body>
    <div id="search-area">
      <p>Suppose here is the document you want to search for</p>
      <p><span>sear</span><span>ch-target</span></p>
    </div>
    <script src="./dom-highlight.min.js"></script>
    <script>
      window.onload = () => {
        // careate instance
        let h = new HighlightString();

        document.body.appendChild(
          h.highlightString("search"),
          document.getElementById("search-area")
        );
        
        // full param sample
        // highlightString(keyword, document.getElementById('search-area'), "span", "require-highlight");
     
      };
    </script>
  </body>
</html>
```
