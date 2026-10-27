# Makefile for THa Trash App - Alu Native Engine

ALU_DIR ?= /home/davidalujones/.gemini/antigravity/scratch/alu-language
ALU_CXX ?= $(ALU_DIR)/cpp_frontend/build/alu_cxx

.PHONY: all clean test

all: bin/tha_trash_engine

bin/tha_trash_engine: bin_optimizer.alu
	@mkdir -p bin
	bash build_alu.sh

test: bin/tha_trash_engine
	./bin/tha_trash_engine

clean:
	rm -rf bin/ bin_optimizer.exe bin_optimizer.alu.ll bin_optimizer_deps.txt
