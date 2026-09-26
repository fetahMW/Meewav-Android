cmake_minimum_required(VERSION 3.22.1)
project(meewav_analysis)
find_package(oboe REQUIRED CONFIG)
add_library(meewav_analysis SHARED TrackAnalysis.cpp WaveVocalDsp.cpp WaveNativeDuplex.cpp)
target_sources(meewav_analysis PRIVATE third_party/daisysp/limiter.cpp third_party/daisysp/overdrive.cpp)
target_compile_features(meewav_analysis PRIVATE cxx_std_17)
# The YIN analysis must meet the 2 ms callback deadline in debug builds too.
set_source_files_properties(TrackAnalysis.cpp WaveNativeDuplex.cpp WaveVocalDsp.cpp third_party/daisysp/limiter.cpp third_party/daisysp/overdrive.cpp PROPERTIES COMPILE_OPTIONS "-O2")
target_link_options(meewav_analysis PRIVATE "-Wl,-z,max-page-size=16384")
target_link_libraries(meewav_analysis PRIVATE
    oboe::oboe log android OpenSLES)
