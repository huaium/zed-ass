(section
  (section_header (section_name) @name)) @item

(section
  (section_header section_name_styles: (_))
  (key_value_pair
    key_style: (key) @context
    (values (value style_name: (style_name) @name))) @item)

(section
  (section_header [section_name_fonts: (_) section_name_graphics: (_)])
  (key_value_pair
    [key_fontname: (key) @context key_filename: (key) @context]
    (values (value) @name)) @item)
