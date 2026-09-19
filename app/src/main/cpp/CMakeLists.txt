cmake_minimum_required(VERSION 3.22.1)
project(meewav_analysis)
add_library(meewav_analysis SHARED TrackAnalysis.cpp)
target_compile_features(meewav_analysis PRIVATE cxx_std_17)
target_include_directories(meewav_analysis PRIVATE superpowered)
target_link_options(meewav_analysis PRIVATE "-Wl,-z,max-page-size=16384")
target_link_libraries(meewav_analysis PRIVATE
    "${CMAKE_CURRENT_SOURCE_DIR}/superpowered/libSuperpoweredAndroid${ANDROID_ABI}.a" log android OpenSLES)
