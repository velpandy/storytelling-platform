import React, { Component } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill stylesheet
import "quill/dist/quill.snow.css"; // If not already imported for Quill
import "./EditorStyles.css"; 

class StoryWriterEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editorContent: "",
      fullscreen: false, // Track fullscreen state
    };
  }

  componentDidMount() {
    this.updateEditorStateFromProps(this.props.initialContent);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.initialContent !== this.props.initialContent) {
      this.updateEditorStateFromProps(this.props.initialContent);
    }
  }

  updateEditorStateFromProps = (initialContent) => {
    if (initialContent) {
      this.setState({ editorContent: initialContent });
    } else {
      this.setState({ editorContent: "" });
    }
  };

  onEditorChange = (value) => {
    this.setState({ editorContent: value });

    if (this.props.onChange) {
      this.props.onChange(value); // Pass HTML content to parent
    }
  };

  toggleFullscreen = () => {
    this.setState((prevState) => ({
      fullscreen: !prevState.fullscreen,
    }));
  };







  render() {
    const { editorContent, fullscreen} = this.state;
    
    

    return (
      <div className={`story-writer-editor ${fullscreen ? "fullscreen" : ""}`}>
        <div className="editor-toolbar">
          <button className="fullscreen-btn" onClick={this.toggleFullscreen}>
            {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        
        </div>

        <ReactQuill
          ref={(el) => (this.quillRef = el)} // Create a reference to the editor
          value={editorContent}
          onChange={this.onEditorChange}
          modules={this.getEditorModules()}
          className="editor-wrapper"
        />

   
      </div>
    );
  }

  getEditorModules = () => {
    return {
      toolbar: [
        [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        [{ 'color': [] }, { 'background': [] }], // Color picker
        ['blockquote', 'code-block'],
        [{ 'size': ['small', 'normal', 'large', 'huge'] }], // Font size options
        ['clean'],
      ],
      clipboard: {
        matchVisual: false, // Disable automatic formatting from copied content
      },
    };
  };
}

export default StoryWriterEditor;
