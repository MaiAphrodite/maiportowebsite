#!/usr/bin/env python3
"""
ONNX INT64 to INT32 Converter for WebGPU Compatibility

This script converts all INT64 operations in an ONNX model to INT32,
making it compatible with ONNX Runtime Web's WebGPU backend.

Usage:
    python patch_onnx_int32.py input.onnx output.onnx
"""

import sys
import numpy as np

try:
    import onnx
    from onnx import numpy_helper, TensorProto
except ImportError:
    print("Error: onnx package not installed. Run: pip install onnx numpy")
    sys.exit(1)


def convert_int64_to_int32(model_path: str, output_path: str) -> None:
    """Convert all INT64 tensors and operations to INT32 in an ONNX model."""
    
    print(f"Loading model: {model_path}")
    model = onnx.load(model_path)
    graph = model.graph
    
    converted_count = 0
    
    # 1. Convert initializers (weights/constants)
    for initializer in graph.initializer:
        if initializer.data_type == TensorProto.INT64:
            # Get the numpy array
            arr = numpy_helper.to_array(initializer)
            
            # Check for overflow
            if arr.min() < np.iinfo(np.int32).min or arr.max() > np.iinfo(np.int32).max:
                print(f"  Warning: {initializer.name} has values outside INT32 range, clamping")
                arr = np.clip(arr, np.iinfo(np.int32).min, np.iinfo(np.int32).max)
            
            # Convert to int32
            arr_int32 = arr.astype(np.int32)
            new_tensor = numpy_helper.from_array(arr_int32, initializer.name)
            
            # Replace in-place
            initializer.CopyFrom(new_tensor)
            converted_count += 1
            print(f"  Converted initializer: {initializer.name}")
    
    # 2. Convert graph inputs
    for input_tensor in graph.input:
        if input_tensor.type.tensor_type.elem_type == TensorProto.INT64:
            input_tensor.type.tensor_type.elem_type = TensorProto.INT32
            converted_count += 1
            print(f"  Converted input: {input_tensor.name}")
    
    # 3. Convert graph outputs
    for output_tensor in graph.output:
        if output_tensor.type.tensor_type.elem_type == TensorProto.INT64:
            output_tensor.type.tensor_type.elem_type = TensorProto.INT32
            converted_count += 1
            print(f"  Converted output: {output_tensor.name}")
    
    # 4. Convert node attributes that specify INT64
    for node in graph.node:
        for attr in node.attribute:
            if attr.type == onnx.AttributeProto.INT:
                # Single int attribute - these are fine as-is
                pass
            elif attr.type == onnx.AttributeProto.INTS:
                # List of ints - check if they're used for dtype
                pass
            elif attr.type == onnx.AttributeProto.TENSOR:
                if attr.t.data_type == TensorProto.INT64:
                    arr = numpy_helper.to_array(attr.t)
                    arr_int32 = arr.astype(np.int32)
                    new_tensor = numpy_helper.from_array(arr_int32, attr.t.name if attr.t.name else "")
                    attr.t.CopyFrom(new_tensor)
                    converted_count += 1
                    print(f"  Converted attribute tensor in node: {node.name}")
        
        # Handle Cast nodes that cast TO int64
        if node.op_type == "Cast":
            for attr in node.attribute:
                if attr.name == "to" and attr.i == TensorProto.INT64:
                    attr.i = TensorProto.INT32
                    converted_count += 1
                    print(f"  Converted Cast node target type: {node.name}")
    
    # 5. Convert value_info (intermediate tensor types)
    for value_info in graph.value_info:
        if value_info.type.tensor_type.elem_type == TensorProto.INT64:
            value_info.type.tensor_type.elem_type = TensorProto.INT32
            converted_count += 1
            print(f"  Converted value_info: {value_info.name}")
    
    print(f"\nTotal conversions: {converted_count}")
    
    # Validate the model
    print("Validating model...")
    try:
        onnx.checker.check_model(model)
        print("Model validation passed!")
    except Exception as e:
        print(f"Warning: Model validation failed: {e}")
        print("The model may still work, but proceed with caution.")
    
    # Save the converted model
    print(f"Saving converted model: {output_path}")
    onnx.save(model, output_path)
    print("Done!")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python patch_onnx_int32.py <input.onnx> <output.onnx>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    convert_int64_to_int32(input_path, output_path)
