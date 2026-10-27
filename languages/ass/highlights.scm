(section_name) @type
(comment) @comment
(key) @property
(value) @string
(attachment_data) @string
(text) @string
(tag_string) @string
(tag_name) @function.builtin
"drawing_command_name" @function.builtin
(escape_sequence) @string.escape
(override_comment) @comment
(override_color) @constant
(unknown_tag_arguments) @string
(ERROR) @hint @error

; Keep scalar captures inside dialogue syntax. Metadata belongs to its column,
; and Comment events must not acquire number or color highlights.
[
  (numeric_tag (number) @number)
  (position_tag (number) @number)
  (move_tag (number) @number)
  (fade_tag (number) @number)
  (transform_tag (number) @number)
  (clip_tag (number) @number)
  (drawing_point (number) @number)
  (drawing_mode_tag (integer) @number)
]

[
  "["
  "]"
  "{"
  "}"
  "("
  ")"
] @punctuation.bracket
"," @punctuation.delimiter
":" @operator
"\\" @punctuation.special

; Zed resolves fallback captures right-to-left. Standard theme colors provide
; the default palette; ass.column.* allows optional per-column overrides.
; Avoid string.ass.column.*: Zed inherits its string prefix before falling back.
(section
  (section_header [section_name_styles: (_) section_name_events: (_)])
  (key_value_pair values_format: (values
    column_1: (value) @string @variable @ass.column.1)))
(section
  (section_header [section_name_styles: (_) section_name_events: (_)])
  (key_value_pair values_format: (values
    column_2: (value) @string @type @ass.column.2)))
(section
  (section_header [section_name_styles: (_) section_name_events: (_)])
  (key_value_pair values_format: (values
    column_3: (value) @string @ass.column.3)))
(section
  (section_header [section_name_styles: (_) section_name_events: (_)])
  (key_value_pair values_format: (values
    column_4: (value) @string @constant @ass.column.4)))
(section
  (section_header [section_name_styles: (_) section_name_events: (_)])
  (key_value_pair values_format: (values
    column_5: (value) @string @function @ass.column.5)))
(section
  (section_header [section_name_styles: (_) section_name_events: (_)])
  (key_value_pair values_format: (values
    column_6: (value) @string @keyword @ass.column.6)))

(section (section_header section_name_styles: (_))
  (key_value_pair values_style: (values column_1: (value) @string @variable @ass.column.1)))
(section (section_header section_name_styles: (_))
  (key_value_pair values_style: (values column_2: (value) @string @type @ass.column.2)))
(section (section_header section_name_styles: (_))
  (key_value_pair values_style: (values column_3: (value) @string @ass.column.3)))
(section (section_header section_name_styles: (_))
  (key_value_pair values_style: (values column_4: (value) @string @constant @ass.column.4)))
(section (section_header section_name_styles: (_))
  (key_value_pair values_style: (values column_5: (value) @string @function @ass.column.5)))
(section (section_header section_name_styles: (_))
  (key_value_pair values_style: (values column_6: (value) @string @keyword @ass.column.6)))

; The last event value is Text, whose commas and override syntax stay intact.
(section (section_header section_name_events: (_))
  (key_value_pair
    [key_dialogue: (key) key_picture: (key) key_sound: (key) key_movie: (key) key_command: (key)]
    (values column_1: (value) @string @variable @ass.column.1 . (value))))
(section (section_header section_name_events: (_))
  (key_value_pair
    [key_dialogue: (key) key_picture: (key) key_sound: (key) key_movie: (key) key_command: (key)]
    (values column_2: (value) @string @type @ass.column.2 . (value))))
(section (section_header section_name_events: (_))
  (key_value_pair
    [key_dialogue: (key) key_picture: (key) key_sound: (key) key_movie: (key) key_command: (key)]
    (values column_3: (value) @string @ass.column.3 . (value))))
(section (section_header section_name_events: (_))
  (key_value_pair
    [key_dialogue: (key) key_picture: (key) key_sound: (key) key_movie: (key) key_command: (key)]
    (values column_4: (value) @string @constant @ass.column.4 . (value))))
(section (section_header section_name_events: (_))
  (key_value_pair
    [key_dialogue: (key) key_picture: (key) key_sound: (key) key_movie: (key) key_command: (key)]
    (values column_5: (value) @string @function @ass.column.5 . (value))))
(section (section_header section_name_events: (_))
  (key_value_pair
    [key_dialogue: (key) key_picture: (key) key_sound: (key) key_movie: (key) key_command: (key)]
    (values column_6: (value) @string @keyword @ass.column.6 . (value))))

; Capture children as comments too: narrower captures take precedence in Zed.
(section (section_header section_name_events: (_))
  (key_value_pair
    key_comment: (key) @comment
    ":" @comment
    values_comment: (values
      (value) @comment)) @comment)
(section (section_header section_name_events: (_))
  (key_value_pair key_comment: (key)
    (values "," @comment)))
(section (section_header section_name_events: (_))
  (key_value_pair key_comment: (key)
    (values (value (text) @comment))))
